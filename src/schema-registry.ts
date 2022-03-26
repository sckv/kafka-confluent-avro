import { Cache } from './cache';
import { ConfluentApi } from './confluent-api';
import { AvroDecoder } from './decoder';
import { Schema } from './schema';

type SchemaCache = {
  schema: { [k: string]: any } | { [k: string]: any }[] | string;
  version: number;
  uniqueId: number;
};
export class SchemaRegistry {
  DEFAULT_OFFSET = 0;
  MAGIC_BYTE = Buffer.alloc(1);

  constructor(
    host: string,
    private avroDecoder: AvroDecoder = new AvroDecoder(),
    private confluentApi: ConfluentApi = new ConfluentApi(host),
    private schemaCache: Cache<SchemaCache> = new Cache(),
  ) {}

  async encodeMessageByTopic(value: any, topic: string): Promise<Schema> {
    const subject = this.createSubject(topic);

    const schemaString = this.schemaCache.get(subject);

    if (!schemaString) {
      const schema = await this.confluentApi.getSubjectByVersion(subject, 'latest');

      this.schemaCache.set(`${subject}-${schema.version}`, {
        uniqueId: schema.id,
        schema: schema.schema,
        version: schema.version,
      });

      this.schemaCache.set(`${schema.id}-unique`, {
        uniqueId: schema.id,
        schema: schema.schema,
        version: schema.version,
      });
    }

    const cachedSchema = this.schemaCache.get(subject)!;
    const encodedPayload = this.avroDecoder.encode(value, cachedSchema.schema as any);

    return new Schema(
      cachedSchema.version,
      encodedPayload,
      subject,
      cachedSchema.schema,
      cachedSchema.uniqueId,
      this,
    );
  }

  async encodePreviousVersion(schema: Schema): Schema {
    if (schema.version === 1) {
      throw new Error('Only have one version of the schema');
    }

    const previousVersion = schema.version - 1;

    const cached = this.schemaCache.get(`${schema.subject}-${previousVersion}`);
    if (!cached) {
      const previousVersionSchema = await this.confluentApi.getSubjectByVersion(
        schema.subject,
        previousVersion,
      );

      this.schemaCache.set(`${schema.subject}-${previousVersion}`, {
        uniqueId: schema.uniqueId,
        schema: schema.schema,
        version: previousVersion,
      });
    }

    const cachedSchema = this.schemaCache.get(`${schema.subject}-${previousVersion}`)!;
    const encodedPayload = this.avroDecoder.encode(schema.payload, cachedSchema.schema as any);
    return new Schema(
      cachedSchema.version,
      encodedPayload,
      schema.subject,
      cachedSchema.schema,
      cachedSchema.uniqueId,
      this,
    );
  }

  async decode<V = any>(value: Buffer): Promise<V> {
    const extractedBuffer = this.extractBuffer(value);

    if (!extractedBuffer.magicByte.equals(this.MAGIC_BYTE)) {
      return JSON.parse(Buffer.toString()) as unknown as V;
    }

    const cached = this.schemaCache.get(`${extractedBuffer.schemaId}-unique`);

    if (!cached) {
      const schema = await this.confluentApi.getSchemaById(extractedBuffer.schemaId);
      const versions = await this.confluentApi.getSchemaVersions(extractedBuffer.schemaId);
      const latestVersionSubject = versions[versions.length - 1];

      this.schemaCache.set(`${extractedBuffer.schemaId}-unique`, {
        uniqueId: extractedBuffer.schemaId,
        schema: schema.schema,
        version: latestVersionSubject.version,
      });

      this.schemaCache.set(`${latestVersionSubject.subject}-${latestVersionSubject.version}`, {
        uniqueId: extractedBuffer.schemaId,
        schema: schema.schema,
        version: latestVersionSubject.version,
      });
    }

    return this.avroDecoder.decode(
      extractedBuffer.payload,
      this.schemaCache.get(`${extractedBuffer.schemaId}-unique`)!.schema as any,
    ) as unknown as V;
  }

  createSubject(topic: string): string {
    return `${topic}-schema`;
  }

  extractBuffer(buf: Buffer) {
    return {
      magicByte: buf.slice(0, 1),
      schemaId: buf.slice(1, 5).readInt32BE(0),
      payload: buf.slice(5, buf.length),
    };
  }

  packBuffer(schemaId: number, encodedPayload: Buffer) {
    const schemaIdBuffer = Buffer.alloc(4);
    schemaIdBuffer.writeInt32BE(schemaId, this.DEFAULT_OFFSET);

    return Buffer.concat([this.MAGIC_BYTE, schemaIdBuffer, encodedPayload]);
  }
}

import { Cache } from './cache';
import { ConfluentApi } from './confluent-api';
import { ConfluentSchema } from './confluent-api-types';
import { AvroDecoder } from './decoder';
import { NoCompatibleVersionError } from './errors';

type SchemaCache = {
  schema: ConfluentSchema;
  version: number;
  subject: string;
  id: number;
  schemaType?: string;
};
export class SchemaRegistry {
  private readonly DEFAULT_OFFSET = 0;
  private readonly MAGIC_BYTE = Buffer.alloc(1);

  constructor(
    connection: { host: string; auth?: { username: string; password: string } },
    public confluentApi: ConfluentApi = new ConfluentApi(connection.host, connection.auth),
    public avroDecoder: AvroDecoder = new AvroDecoder(),
    public schemaCache: Cache<SchemaCache> = new Cache(),
  ) {}

  setCache(propertiesToCache: {
    subject: string;
    id: number;
    version: number;
    schemaType?: string;
    schema: ConfluentSchema;
  }) {
    this.schemaCache.set(propertiesToCache.subject, {
      id: propertiesToCache.id,
      schema: propertiesToCache.schema,
      version: propertiesToCache.version,
      subject: propertiesToCache.subject,
      schemaType: propertiesToCache.schemaType || 'AVRO',
    });

    this.schemaCache.set(`${propertiesToCache.id}`, {
      id: propertiesToCache.id,
      schema: propertiesToCache.schema,
      version: propertiesToCache.version,
      subject: propertiesToCache.subject,
      schemaType: propertiesToCache.schemaType || 'AVRO',
    });
  }

  async encodeMessageByTopic(
    value: any,
    topic: string,
    schemaCache?: SchemaCache,
  ): Promise<Buffer> {
    const subject = this.createSubject(topic);

    let schema = schemaCache || this.schemaCache.get(subject);

    if (!schema) {
      schema = await this.confluentApi.getEntryBySubjectAndVersion(subject, 'latest');
      this.setCache(schema);
    }

    const encodedPayload = this.avroDecoder.encode(value, schema.schema as any);
    return this.packBuffer(schema.id, encodedPayload);
  }

  async encodeMessageBySchemaId(value: any, schemaId: number): Promise<Buffer> {
    let schema = this.schemaCache.get(`${schemaId}`);

    if (!schema) {
      const schemaVersions = await this.confluentApi.getSchemaVersions(schemaId);
      schema = await await this.confluentApi.getEntryBySubjectAndVersion(
        schemaVersions[0].subject,
        'latest',
      );

      this.setCache(schema);
    }

    const encodedPayload = this.avroDecoder.encode(value, schema.schema as any);
    return this.packBuffer(schema.id, encodedPayload);
  }

  async encodeMessageByTopicSafe(value: any, topic: string, recourseIndex = 1): Promise<Buffer> {
    if (recourseIndex && recourseIndex > 3) {
      throw new NoCompatibleVersionError(value, topic, recourseIndex);
    }

    const subject = this.createSubject(topic);
    let schema = this.schemaCache.get(subject);

    if (!schema) {
      schema = await this.confluentApi.getEntryBySubjectAndVersion(subject, 'latest');
      this.setCache(schema);
    }

    try {
      const encodedPayload = this.avroDecoder.encode(value, schema.schema as any);
      return this.packBuffer(schema.id, encodedPayload);
    } catch (error) {
      console.log(error);
      if (schema.version === 1) {
        throw new NoCompatibleVersionError(value, topic, recourseIndex);
      }

      const previousVersion = await this.confluentApi.getEntryBySubjectAndVersion(
        subject,
        schema.version - 1,
      );

      this.setCache(previousVersion);
      return this.encodeMessageByTopicSafe(value, topic, recourseIndex + 1);
    }
  }

  async decode<V = any>(value: Buffer): Promise<V> {
    const extractedBuffer = this.extractBuffer(value);

    if (!extractedBuffer.magicByte.equals(this.MAGIC_BYTE)) {
      return JSON.parse(Buffer.toString()) as unknown as V;
    }

    let cached = this.schemaCache.get(`${extractedBuffer.schemaId}-unique`);

    if (!cached) {
      const schema = await this.confluentApi.getSchemaById(extractedBuffer.schemaId);
      const versions = await this.confluentApi.getSchemaVersions(extractedBuffer.schemaId);
      const latestVersionSubject = versions[versions.length - 1];

      cached = {
        id: extractedBuffer.schemaId,
        schema,
        version: latestVersionSubject.version,
        subject: latestVersionSubject.subject,
      };

      this.setCache(cached);
    }

    return this.avroDecoder.decode(extractedBuffer.payload, cached.schema as any) as unknown as V;
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

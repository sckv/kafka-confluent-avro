import { SchemaRegistry } from './schema-registry';

export class Schema {
  version: number;
  payload: Buffer;
  subject: string;
  schema: string | { [key: string]: any } | { [key: string]: any }[];
  uniqueId: number;
  registry: SchemaRegistry;

  constructor(
    version: number,
    payload: Buffer,
    subject: string,
    schema: string | { [key: string]: any } | { [key: string]: any }[],
    uniqueId: number,
    registry: SchemaRegistry,
  ) {
    this.version = version;
    this.payload = payload;
    this.subject = subject;
    this.schema = schema;
    this.uniqueId = uniqueId;
    this.registry = registry;
  }

  getPayload(): Buffer {
    return this.payload;
  }

  encodeWithPreviousVersion(): Buffer {
    this.registry.encodeMessageByTopic(value, topic);
  }
}

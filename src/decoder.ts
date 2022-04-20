import avro from 'avsc';

import { Cache } from './cache';
import { AvroSchemaDecodeError } from './errors';
import { ConfluentSchema } from './confluent-api-types';

import { format, inspect } from 'util';

export class AvroDecoder {
  cache: Cache<avro.Type>;

  constructor() {
    this.cache = new Cache(1000 * 60 * 60 * 24);
  }

  decode<V extends { [k: string]: any }>(
    buffer: Buffer,
    schema: ConfluentSchema | avro.schema.AvroSchema,
  ): V {
    const avroType = this.convertToType(schema);

    return avroType.fromBuffer(buffer);
  }

  encode(data: string, schema: ConfluentSchema): Buffer {
    const avroType = this.convertToType(schema);

    this.assertValid(avroType, data);

    return avroType.toBuffer(data);
  }

  convertToType(schema: avro.schema.AvroSchema | ConfluentSchema): avro.Type {
    return avro.Type.forSchema(schema as any);
  }

  assertValid(type: avro.Type, value: any): boolean {
    return type.isValid(value, {
      errorHook: function hook(path, foundValue) {
        throw new AvroSchemaDecodeError(format('invalid %s: %j', path.join(), foundValue));
      },
    });
  }
}

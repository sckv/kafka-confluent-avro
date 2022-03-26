import avro from 'avsc';

import { Cache } from './cache';
import { AvroSchemaDecodeError } from './errors';

import { format } from 'util';
import crypto from 'crypto';

export class AvroDecoder {
  cache: Cache<avro.Type>;

  constructor() {
    this.cache = new Cache(1000 * 60 * 60 * 24);
  }

  decode<V extends { [k: string]: any }>(
    buffer: Buffer,
    schema: string | avro.schema.AvroSchema,
  ): V {
    const avroType = this.convertToType(schema);

    return avroType.fromBuffer(buffer);
  }

  encode(data: string, schema: string): Buffer {
    const avroType = this.convertToType(schema);

    this.assertValid(avroType, data);

    return avroType.toBuffer(data);
  }

  convertToType(schema: string | avro.schema.AvroSchema): avro.Type {
    return avro.Type.forSchema(typeof schema === 'string' ? JSON.stringify(schema) : schema);
  }

  assertValid(type: avro.Type, value: any): boolean {
    return type.isValid(value, {
      errorHook: function hook(path, foundValue) {
        throw new AvroSchemaDecodeError(format('invalid %s: %j', path.join(), foundValue));
      },
    });
  }
}

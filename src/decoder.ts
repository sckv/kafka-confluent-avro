import { schema, Type } from 'avsc';

import { AvroSchemaDecodeError } from './errors';
import { ConfluentSchema } from './confluent-api-types';

import { format } from 'util';

export class AvroDecoder {
  decode<V extends { [k: string]: any }>(
    buffer: Buffer,
    schema: ConfluentSchema | schema.AvroSchema,
  ): V {
    const avroType = this.convertToType(schema);

    return avroType.fromBuffer(buffer);
  }

  encode(data: string, schema: ConfluentSchema): Buffer {
    const avroType = this.convertToType(schema);

    this.assertValid(avroType, data);

    return avroType.toBuffer(data);
  }

  convertToType(schema: ConfluentSchema): Type {
    return Type.forSchema(schema);
  }

  assertValid(type: Type, value: any): boolean {
    return type.isValid(value, {
      errorHook: function hook(path, foundValue, type) {
        throw new AvroSchemaDecodeError(
          format('invalid %s - %j, should be of type %s', path.join(), foundValue, type),
        );
      },
    });
  }
}

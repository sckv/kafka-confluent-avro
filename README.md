# kafka-confluent-avro

Lightweight kafka confluent registry integration for avro runtime schema serialization and de-serialization. Implements intelligent encoding and decoding of avro schema to/from kafka messages.

# Usage

```ts
import { SchemaRegistry } from 'kafka-confluent-avro';

const registry = new SchemaRegistry({ host: 'https://confluent.registry:8081' });

registry.encodeMessageByTopic(valueToEncode, 'topic');
```

# APIs

### `encodeMessageByTopic`

Encode a value with a latest schema for a topic. Subject for that stored schema should be the `${topic name}-value`;

### `encodeMessageBySchemaId`

Encode a value with a latest version of a schema by unique schema id.

### `encodeMessageByTopicSafe`

Safely encode a value with some schema for a topic. If the value is invalid for the `latest` version of the schema, it will retry downgrading the schema to the previous version.

The process will retry for **3 previous versions**, throws an error if there is no valid outcome.

### `decode`

Decode a kafka message (buffer) with the encoded schema. If there's no schemaId encoded in the message, just returns the value of the message as is.

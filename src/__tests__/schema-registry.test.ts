import { DockerComposeEnvironment, StartedDockerComposeEnvironment } from 'testcontainers';
import { Consumer, Kafka, Producer } from 'kafkajs';

import { SchemaRegistry } from '..';

import { resolve } from 'path';

const fixtures = {
  v1: {
    type: 'record',
    name: 'AnotherPerson',
    namespace: 'com.org.domain.fixtures',
    fields: [{ type: 'string', name: 'fullName' }],
  },
  v2: {
    type: 'record',
    name: 'AnotherPerson',
    namespace: 'com.org.domain.fixtures',
    fields: [
      { type: 'string', name: 'fullName' },
      { type: 'string', name: 'city', default: 'Stockholm' },
    ],
  },
  v3: {
    type: 'record',
    name: 'AnotherPerson',
    namespace: 'com.org.domain.fixtures',
    fields: [
      { type: 'string', name: 'fullName' },
      { type: 'string', name: 'city', default: 'Stockholm' },
      { type: 'int', name: 'age', default: 0 },
    ],
  },
  v4: {
    type: 'record',
    name: 'AnotherPerson',
    namespace: 'com.org.domain.fixtures',
    fields: [
      { type: 'string', name: 'fullName' },
      { type: 'string', name: 'city', default: 'Stockholm' },
      { type: 'int', name: 'age', default: 0 },
      { type: 'string', name: 'email', default: 'email@example.com' },
    ],
  },
};

describe('Schema Registry suite', () => {
  let environment: StartedDockerComposeEnvironment;
  let kafka: Kafka;
  let consumer: Consumer;
  let producer: Producer;

  const schemaRegistry = new SchemaRegistry({ host: 'http://localhost:8081' });

  beforeAll(async () => {
    environment = await new DockerComposeEnvironment(resolve(__dirname), 'docker-compose.yml').up();

    kafka = new Kafka({
      clientId: 'test',
      brokers: ['localhost:9092'],
    });
    consumer = kafka.consumer({ groupId: 'test' });
    producer = kafka.producer({ allowAutoTopicCreation: true });

    await consumer.connect();
    await producer.connect();
  });

  afterAll(async () => {
    await consumer.disconnect();
    await producer.disconnect();
    await environment.down();
  });

  test('Creates and retrieves a schema by direct api', async () => {
    await schemaRegistry.confluentApi.createSchemaBySubject({
      schema: fixtures.v1,
      subject: schemaRegistry.createSubject('test-topic'),
    });

    const schema = await schemaRegistry.confluentApi.getEntryBySubjectAndVersion(
      schemaRegistry.createSubject('test-topic'),
      'latest',
    );

    expect(schema).toEqual(fixtures.v1);
  });
});

import { NoCompatibleVersionError } from '../errors';
import { SchemaRegistry } from '../schema-registry';

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
      { type: 'string', name: 'city' },
    ],
  },
  v3: {
    type: 'record',
    name: 'AnotherPerson',
    namespace: 'com.org.domain.fixtures',
    fields: [
      { type: 'string', name: 'fullName' },
      { type: 'string', name: 'city' },
      { type: 'int', name: 'age' },
    ],
  },
  v4: {
    type: 'record',
    name: 'AnotherPerson',
    namespace: 'com.org.domain.fixtures',
    fields: [
      { type: 'string', name: 'fullName' },
      { type: 'string', name: 'city' },
      { type: 'int', name: 'age' },
      { type: 'string', name: 'email' },
    ],
  },
};

describe('Schema Registry suite', () => {
  let latestSchemaId: number;

  const schemaRegistry = new SchemaRegistry({ host: 'http://localhost:8081' });

  beforeAll(async () => {
    await schemaRegistry.confluentApi.configGlobalCompatibility('FORWARD');
    await schemaRegistry.confluentApi.deleteSubject('test-topic-value').catch(console.error);
    await schemaRegistry.confluentApi.deleteSubject('test-topic-value', true).catch(console.error);
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

    expect(schema).toEqual(
      expect.objectContaining({ subject: 'test-topic-value', schema: fixtures.v1 }),
    );
  });

  test('Sets a second different version for the topic schema', async () => {
    await schemaRegistry.confluentApi.createSchemaBySubject({
      schema: fixtures.v2,
      subject: schemaRegistry.createSubject('test-topic'),
    });

    const schema = await schemaRegistry.confluentApi.getEntryBySubjectAndVersion(
      schemaRegistry.createSubject('test-topic'),
      'latest',
    );

    expect(schema).toEqual(
      expect.objectContaining({ subject: 'test-topic-value', schema: fixtures.v2 }),
    );
  });

  test('Sets a third different version for the topic schema', async () => {
    await schemaRegistry.confluentApi.createSchemaBySubject({
      schema: fixtures.v3,
      subject: schemaRegistry.createSubject('test-topic'),
    });

    const schema = await schemaRegistry.confluentApi.getEntryBySubjectAndVersion(
      schemaRegistry.createSubject('test-topic'),
      'latest',
    );

    expect(schema).toEqual(
      expect.objectContaining({ subject: 'test-topic-value', schema: fixtures.v3 }),
    );
  });

  test('Sets a fourth different version for the topic schema', async () => {
    await schemaRegistry.confluentApi.createSchemaBySubject({
      schema: fixtures.v4,
      subject: schemaRegistry.createSubject('test-topic'),
    });

    const schema = await schemaRegistry.confluentApi.getEntryBySubjectAndVersion(
      schemaRegistry.createSubject('test-topic'),
      'latest',
    );

    latestSchemaId = schema.id;

    expect(schema).toEqual(
      expect.objectContaining({ subject: 'test-topic-value', schema: fixtures.v4 }),
    );
  });

  test('Tries to encode with the latest version of the topic with a wrong object 3 versions under', async () => {
    const schema = await schemaRegistry.encodeMessageByTopicSafe(
      { fullName: 'Full Name', city: 'City' },
      'test-topic',
    );

    const decoded = await schemaRegistry.decode(schema);

    expect({ fullName: 'Full Name', city: 'City' }).toEqual(decoded);
  });

  test('Tries to encode with the latest version of the topic with latest object', async () => {
    const schema = await schemaRegistry.encodeMessageByTopicSafe(
      { fullName: 'Full Name', city: 'City', age: 1, email: 'example@kek.com' },
      'test-topic',
    );

    const decoded = await schemaRegistry.decode(schema);

    expect({ fullName: 'Full Name', city: 'City', age: 1, email: 'example@kek.com' }).toEqual(
      decoded,
    );
  });

  test('Fails to encode with an object that is >3 versions old', async () => {
    await expect(() =>
      schemaRegistry.encodeMessageByTopicSafe({ fullName: 'Full Name' }, 'test-topic'),
    ).rejects.toThrow(NoCompatibleVersionError);
  });

  test('Encodes and correctly decodes a schema by uniqueSchema id', async () => {
    const encoded = await schemaRegistry.encodeMessageBySchemaId(
      { fullName: 'Full Name', city: 'City', age: 1, email: 'example@kek.com' },
      latestSchemaId,
    );

    const decoded = await schemaRegistry.decode(encoded);

    expect(decoded).toEqual({
      fullName: 'Full Name',
      city: 'City',
      age: 1,
      email: 'example@kek.com',
    });
  });

  test('Do not decode a buffer with no schema enabled', async () => {
    const buf = Buffer.from(
      JSON.stringify({
        fullName: 'Full Name',
        city: 'City',
        age: 1,
        email: 'example@kek.com',
      }),
    );

    const decoded = await schemaRegistry.decode(buf);

    expect(decoded).toEqual({
      fullName: 'Full Name',
      city: 'City',
      age: 1,
      email: 'example@kek.com',
    });
  });
});

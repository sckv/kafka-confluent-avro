export type ConfluentSchema = { [k: string]: any } | { [k: string]: any }[];
/**
 * @see https://docs.confluent.io/platform/current/schema-registry/develop/api.html#get--schemas-ids-int-%20id
 */
export type GetSchemaByIdResponse = {
  schema: ConfluentSchema;
};

/**
 * @see https://docs.confluent.io/platform/current/schema-registry/develop/api.html#get--schemas-types-
 */
export type GetSchemasTypesResponse = string[];

/**
 * @see https://docs.confluent.io/platform/current/schema-registry/develop/api.html#get--schemas-ids-int-%20id-versions
 */
export type GetSchemaVersionsResponse = {
  subject: string;
  version: number;
}[];

/**
 * @see https://docs.confluent.io/platform/current/schema-registry/develop/api.html#get--subjects
 */
export type GetSubjectsResponse = string[];

/**
 * @see https://docs.confluent.io/platform/current/schema-registry/develop/api.html#get--subjects-(string-%20subject)-versions
 */
export type GetSubjectVersionsResponse = number[];

/**
 * @see https://docs.confluent.io/platform/current/schema-registry/develop/api.html#delete--subjects-(string-%20subject)
 */
export type DeleteSubjectResponse = number[];

/**
 * @see https://docs.confluent.io/platform/current/schema-registry/develop/api.html#get--subjects-(string-%20subject)-versions-(versionId-%20version)
 */
export type GetSchemaBySubjectAndVersionResponse = {
  subject: string;
  id: number;
  version: number;
  schemaType?: string;
  schema: ConfluentSchema;
};

/**
 * @see https://docs.confluent.io/platform/current/schema-registry/develop/api.html#get--subjects-(string-%20subject)-versions-(versionId-%20version)-schema
 */
export type GetSubjectVersionSchema = { [k: string]: any };

/**
 * @see https://docs.confluent.io/platform/current/schema-registry/develop/api.html#post--subjects-(string-%20subject)-versions
 */
export type CreateSubjectSchemaParameter = {
  schema: string;
  schemaType?: string;
  references?: string;
};
export type CreateSubjectSchema = {
  id: number;
};

/**
 * @see https://docs.confluent.io/platform/current/schema-registry/develop/api.html#post--subjects-(string-%20subject)
 */
export type CreateSchemaBySubject = {
  subject: string;
  schema: ConfluentSchema;
  schemaType?: 'AVRO';
  normalize?: boolean;
};

export type CreateSchemaBySubjectResponse = {
  subject: string;
  id: number;
  schema: ConfluentSchema;
  version: number;
};

import { Client } from 'undici';

import {
  GetSchemaByIdResponse,
  GetSchemasTypesResponse,
  GetSchemaVersionsResponse,
  GetSchemaBySubjectAndVersionResponse,
  GetSubjectsResponse,
  GetSubjectVersionSchema,
  GetSubjectVersionsResponse,
  CreateSchemaBySubject,
  CreateSchemaBySubjectResponse,
  DeleteSubjectResponse,
} from './confluent-api-types';
import { ConfluentApiError } from './errors';

export class ConfluentApi {
  headers: { [k: string]: any } = {
    accept:
      'application/vnd.schemaregistry.v1+json, application/vnd.schemaregistry+json, application/json',
    'content-type': 'application/json',
  };

  client: Client;

  constructor(public host: string, auth?: { username: string; password: string }) {
    if (auth) this.setAuth(auth);
    this.client = new Client(this.host);
  }

  setAuth(auth: { username: string; password: string }) {
    this.headers.authorization = `Basic ${Buffer.from(`${auth.username}:${auth.password}`).toString(
      'base64',
    )}`;
  }

  async createSchemaBySubject({
    schema,
    subject,
    normalize = true,
    schemaType = 'AVRO',
  }: CreateSchemaBySubject): Promise<CreateSchemaBySubjectResponse> {
    const stringifiedSchema = JSON.stringify({ schema: JSON.stringify(schema), schemaType });

    const { body } = await this.client.request({
      path: `/subjects/${subject}/versions?normalize=${normalize}`,
      method: 'POST',
      headers: this.headers,
      body: stringifiedSchema,
    });

    const halfResponse = await body.json();
    if (halfResponse.error_code) {
      throw new ConfluentApiError(halfResponse.error_code, halfResponse.message);
    }

    const { body: body2 } = await this.client.request({
      path: `/subjects/${subject}?normalize=${normalize}`,
      method: 'POST',
      headers: this.headers,
      body: stringifiedSchema,
    });

    const subjectVersionJson = await body2.json();
    if (subjectVersionJson.error_code) {
      throw new ConfluentApiError(subjectVersionJson.error_code, subjectVersionJson.message);
    }

    return subjectVersionJson;
  }

  async getSchemaById(id: number): Promise<GetSchemaByIdResponse> {
    const jsonResponse = await this.callApi(`${this.host}/schemas/ids/${id}`);

    return JSON.parse(jsonResponse.schema);
  }

  async getSchemasTypes(): Promise<GetSchemasTypesResponse> {
    return await this.callApi(`${this.host}/schemas/types`);
  }

  async getSchemaVersions(schemaId: number): Promise<GetSchemaVersionsResponse> {
    return await this.callApi(`${this.host}/schemas/ids/${schemaId}/versions`);
  }

  async getSubjects(): Promise<GetSubjectsResponse> {
    return await this.callApi(`${this.host}/subjects`);
  }

  async getSubjectVersions(subject: string): Promise<GetSubjectVersionsResponse> {
    return await this.callApi(`${this.host}/subjects/${subject}/versions`);
  }

  async getEntryBySubjectAndVersion(
    subject: string,
    version: number | 'latest',
  ): Promise<GetSchemaBySubjectAndVersionResponse> {
    const json = await this.callApi(`${this.host}/subjects/${subject}/versions/${version}`);

    return {
      ...json,
      schema: JSON.parse(json.schema),
    };
  }

  async getSchemaBySubjectAndVersion(
    subject: string,
    version: number | 'latest',
  ): Promise<GetSubjectVersionSchema> {
    return await this.callApi(`${this.host}/subjects/${subject}/versions/${version}/schema`);
  }

  async callApi(url: string): Promise<any> {
    const { body } = await this.client.request({
      path: url,
      method: 'GET',
      headers: this.headers,
    });

    const json = await body.json();
    if (json.error_code) {
      throw new ConfluentApiError(json.error_code, json.message);
    }

    return json;
  }

  async deleteSubject(subject: string, permanent = false): Promise<DeleteSubjectResponse> {
    const { body } = await this.client.request({
      method: 'DELETE',
      path: `/subjects/${subject}?permanent=${permanent}`,
      headers: this.headers,
    });

    const json = await body.json();
    if (json.error_code) {
      throw new ConfluentApiError(json.error_code, json.message);
    }
    return json;
  }

  async configGlobalCompatibility(
    mode:
      | 'BACKWARD'
      | 'BACKWARD_TRANSITIVE'
      | 'FORWARD'
      | 'FORWARD_TRANSITIVE'
      | 'FULL'
      | 'FULL_TRANSITIVE'
      | 'NONE',
  ) {
    const { body } = await this.client.request({
      method: 'PUT',
      path: `/config`,
      headers: this.headers,
      body: JSON.stringify({ compatibility: mode }),
    });

    const json = await body.json();
    if (json.error_code) {
      throw new ConfluentApiError(json.error_code, json.message);
    }

    return json;
  }
}

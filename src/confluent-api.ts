import fetch from 'node-fetch';

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
} from './confluent-api-types';
import { ConfluentApiError } from './errors';

import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent } from 'https';

export class ConfluentApi {
  headers: { [k: string]: any } = {
    accept:
      'application/vnd.schemaregistry.v1+json, application/vnd.schemaregistry+json, application/json',
  };

  agent: HttpAgent | HttpsAgent;

  constructor(public host: string, auth?: { username: string; password: string }) {
    if (auth) this.setAuth(auth);

    if (host.startsWith('http://')) {
      this.agent = new HttpAgent();
    } else {
      this.agent = new HttpsAgent();
    }
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
    const response = await fetch(
      `${this.host}/subjects/${subject}/versions?normalize=${normalize}`,
      {
        method: 'POST',
        headers: this.headers,
        agent: this.agent,
        body: JSON.stringify({ schema: JSON.stringify(schema), schemaType }),
      },
    );

    const json = await response.json();
    if (json.error_code) {
      throw new ConfluentApiError(json.error_code, json.message);
    }

    return {
      ...json,
      schema: JSON.parse(json.schema),
    };
  }

  async getSchemaById(id: number): Promise<GetSchemaByIdResponse> {
    const response = await fetch(`${this.host}/schemas/ids/${id}`, {
      headers: this.headers,
      agent: this.agent,
    });

    const json = await response.json();
    if (json.error_code) {
      throw new ConfluentApiError(json.error_code, json.message);
    }

    return { schema: JSON.parse(json.schema) };
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
    const response = await fetch(url, {
      headers: this.headers,
      agent: this.agent,
    });

    const json = await response.json();
    if (json.error_code) {
      throw new ConfluentApiError(json.error_code, json.message);
    }

    return json;
  }

  // async deleteSubject(subject: string): Promise<DeleteSubjectResponse> {
  //   const response = await fetch(`${this.host}/subjects/${subject}`, {
  //     method: 'DELETE',
  //     headers: this.headers,
  //   });

  //   const json = await response.json();

  //   if (json.error_code) {
  //     throw new ConfluentApiError(json.error_code, json.message);
  //   }
  //   return json;
  // }
}

import fetch from 'node-fetch';

import {
  DeleteSubjectResponse,
  GetSchemaByIdResponse,
  GetSchemasTypesResponse,
  GetSchemaVersionsResponse,
  GetSchemaBySubjectAndVersionResponse,
  GetSubjectsResponse,
  GetSubjectVersionSchema,
  GetSubjectVersionsResponse,
} from './confluent-api-types';
import { ConfluentApiError } from './errors';

import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent } from 'https';

export class ConfluentApi {
  headers: { [k: string]: any } = {
    accept: 'application/vnd.schemaregistry.v1+json, application/json',
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
    const response = await fetch(`${this.host}/schemas/types`, {
      headers: this.headers,
      agent: this.agent,
    });

    const json = await response.json();
    if (json.error_code) {
      throw new ConfluentApiError(json.error_code, json.message);
    }
    return json;
  }

  async getSchemaVersions(schemaId: number): Promise<GetSchemaVersionsResponse> {
    const response = await fetch(`${this.host}/schemas/ids/${schemaId}/versions`, {
      headers: this.headers,
      agent: this.agent,
    });
    const json = await response.json();
    if (json.error_code) {
      throw new ConfluentApiError(json.error_code, json.message);
    }
    return json;
  }

  async getSubjects(): Promise<GetSubjectsResponse> {
    const response = await fetch(`${this.host}/subjects`, {
      headers: this.headers,
      agent: this.agent,
    });
    const json = await response.json();
    if (json.error_code) {
      throw new ConfluentApiError(json.error_code, json.message);
    }
    return json;
  }

  async getSubjectVersions(subject: string): Promise<GetSubjectVersionsResponse> {
    const response = await fetch(`${this.host}/subjects/${subject}/versions`, {
      headers: this.headers,
      agent: this.agent,
    });
    const json = await response.json();
    if (json.error_code) {
      throw new ConfluentApiError(json.error_code, json.message);
    }
    return json;
  }

  async deleteSubject(subject: string): Promise<DeleteSubjectResponse> {
    const response = await fetch(`${this.host}/subjects/${subject}`, {
      method: 'DELETE',
      headers: this.headers,
    });

    const json = await response.json();

    if (json.error_code) {
      throw new ConfluentApiError(json.error_code, json.message);
    }
    return json;
  }

  async getSchemaBySubjectAndVersion(
    subject: string,
    version: number | 'latest',
  ): Promise<GetSchemaBySubjectAndVersionResponse> {
    const response = await fetch(`${this.host}/subjects/${subject}/versions/${version}`, {
      headers: this.headers,
      agent: this.agent,
    });

    const json = await response.json();

    if (json.error_code) {
      throw new ConfluentApiError(json.error_code, json.message);
    }
    return {
      ...json,
      schema: JSON.parse(json.schema),
    };
  }

  async getSubjectVersionSchema(
    subject: string,
    version: number | 'latest',
  ): Promise<GetSubjectVersionSchema> {
    const response = await fetch(`${this.host}/subjects/${subject}/versions/${version}/schema`, {
      headers: this.headers,
      agent: this.agent,
    });

    const json = await response.json();

    if (json.error_code) {
      throw new ConfluentApiError(json.error_code, json.message);
    }
    return json;
  }
}

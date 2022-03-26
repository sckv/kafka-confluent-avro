import fetch from 'node-fetch';

type ConfluentApiError = {
  error_code: number;
  message: string;
};

export class ConfluentApi {
  headers = {
    accept: 'application/vnd.schemaregistry.v1+json, application/json',
  };

  constructor() {}
}

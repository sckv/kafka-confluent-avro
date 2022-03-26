/* eslint-disable max-classes-per-file */
export class ConfluentApiError extends Error {
  error_code: number;

  constructor(error_code: number, message: string) {
    super(message);
    this.error_code = error_code;
  }
}

export class AvroSchemaDecodeError extends Error {
  constructor(message: string) {
    super(message);
  }
}

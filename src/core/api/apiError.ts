import { AppError } from '../errors/AppError';

export class ApiError extends AppError {
  constructor(
    message: string,
    code: string,
    public readonly statusCode?: number,
    public readonly details?: unknown,
  ) {
    super(message, code, statusCode);
    this.name = 'ApiError';
  }
}

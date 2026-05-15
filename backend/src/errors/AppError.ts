export type AppErrorPayload = Record<string, string[]>;

export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly errors: AppErrorPayload;

  constructor(code: string, status: number, errors: AppErrorPayload) {
    super(code);
    this.code = code;
    this.status = status;
    this.errors = errors;
  }
}

export const Errors = {
  validation: (errors: AppErrorPayload) => new AppError('VALIDATION_ERROR', 422, errors),
  unauthorized: (msg = 'token missing or invalid') =>
    new AppError('AUTH_TOKEN_INVALID', 401, { auth: [msg] }),
  forbidden: (msg = 'forbidden') =>
    new AppError('AUTH_FORBIDDEN', 403, { auth: [msg] }),
  notFound: (resource = 'resource') =>
    new AppError(`${resource.toUpperCase()}_NOT_FOUND`, 404, { [resource]: ['not found'] }),
  conflict: (field: string, msg = 'has already been taken') =>
    new AppError(`${field.toUpperCase()}_TAKEN`, 422, { [field]: [msg] }),
  invalidCredentials: () =>
    new AppError('AUTH_INVALID_CREDENTIALS', 422, { 'email or password': ['is invalid'] }),
  selfFollow: () =>
    new AppError('PROFILE_SELF_FOLLOW', 422, { follow: ['cannot follow yourself'] }),
};

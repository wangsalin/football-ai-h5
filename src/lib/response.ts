export type ApiSuccess<T> = {
  ok: true;
  data: T;
  message?: string;
};

export type ApiError = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export function ok<T>(data: T, message?: string): ApiSuccess<T> {
  return { ok: true, data, message };
}

export function fail(code: string, message: string, details?: unknown): ApiError {
  return { ok: false, error: { code, message, details } };
}

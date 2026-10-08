export type ApiRequest = Record<string, unknown>;

export type ApiResponse<T> = {
  data: T;
  metadata?: Record<string, unknown>;
};

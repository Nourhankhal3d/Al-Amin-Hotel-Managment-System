const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => undefined);
    throw new Error(errorBody?.message ?? 'Request failed');
  }

  return response.json() as Promise<T>;
}

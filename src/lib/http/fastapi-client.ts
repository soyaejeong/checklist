import { API_BASE_URL } from '@/lib/constants';

export async function fastapiClient<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
  } = {},
): Promise<T> {
  const { method = 'GET', body } = options;
  const url = `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    throw new Error(`FastAPI request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

const API_BASE = '/api';

export class ApiError extends Error {
  statusCode: number;
  details?: any;

  constructor(message: string, statusCode: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('rivo_token');

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Only set Content-Type if body is not FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('/') ? `${API_BASE}${endpoint}` : `${API_BASE}/${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const contentType = response.headers.get('content-type');
  let data: any;

  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else if (contentType && (contentType.includes('text/csv') || contentType.includes('text/plain'))) {
    data = await response.text();
    return data as T;
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = data?.error || response.statusText || 'Request failed';
    throw new ApiError(errorMsg, response.status, data?.details);
  }

  return data as T;
}

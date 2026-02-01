import { createTypedEmitter } from '@repo/events';
import { API_CONFIG } from './config';
import { buildQueryString } from './utils';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string,
    public isNetworkError = false
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function isGlobalError(status: number): boolean {
  return status >= 500 || status === 0;
}

const emitNotification = createTypedEmitter('notification:show');

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = new ApiError(
      `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      response.statusText,
      false
    );

    if (isGlobalError(response.status)) {
      emitNotification({
        type: 'error',
        message: `Server error: ${response.statusText || 'Unknown error'}`,
        duration: 5000,
      });
    }

    throw error;
  }

  return response.json() as Promise<T>;
}

export type QueryParams = Record<string, string | number | boolean | undefined>;

export interface RequestOptions {
  params?: QueryParams;
  signal?: AbortSignal;
}

export async function apiGet<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, signal } = options;
  const queryString = params ? buildQueryString(params) : '';
  const url = `${API_CONFIG.PROXY_BASE_URL}${endpoint}${queryString}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal,
    });

    return handleResponse<T>(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    const isAborted = error instanceof DOMException && error.name === 'AbortError';
    if (isAborted) {
      throw error;
    }

    const networkError = new ApiError('Network error', 0, 'Network Error', true);

    emitNotification({
      type: 'error',
      message: 'Network error: Please check your connection',
      duration: 5000,
    });

    throw networkError;
  }
}

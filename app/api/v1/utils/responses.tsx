// app/api/v1/utils/responses.tsx
// This is for standard API responses

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiFailureResponse<E = string> {
  success: false;
  message: string;
  error?: E;
}

/**
 * ✅ Use for successful responses
 * @param data - The payload (typed)
 * @param message - Optional message
 */
export function success<T>(data: T, message = "Success"): ApiSuccessResponse<T> {
  return {
    success: true,
    message,
    data,
  };
}

/**
 * ❌ Use for failed responses
 * @param message - Error message
 * @param error - Optional typed error info (visible only in development)
 */
export function failure<E = string>(
  message = "Something went wrong",
  error?: E,
): ApiFailureResponse<E> {
  return {
    success: false,
    message,
    error: process.env.NODE_ENV === "development" ? error : undefined,
  };
}


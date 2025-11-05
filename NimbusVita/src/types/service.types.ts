/**
 * Standardized Service Response Types
 * Provides consistent error handling across all service layers
 */

/**
 * Error codes for categorizing service failures
 */
export enum ServiceErrorCode {
  // Network & API Errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  TIMEOUT = 'TIMEOUT',
  
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  
  // Validation Errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Data Errors
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  DATA_CORRUPTION = 'DATA_CORRUPTION',
  
  // Storage Errors
  STORAGE_ERROR = 'STORAGE_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  
  // Unknown
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Success response from a service call
 */
export interface ServiceSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Error response from a service call
 */
export interface ServiceError {
  success: false;
  error: {
    code: ServiceErrorCode;
    message: string;
    userMessage: string; // User-friendly message for UI display
    details?: any; // Optional technical details for debugging
  };
}

/**
 * Unified service response type (discriminated union)
 * @example
 * ```ts
 * const result: ServiceResponse<User> = await loginUser(email, password);
 * if (result.success) {
 *   console.log('User:', result.data);
 * } else {
 *   console.error('Error:', result.error.userMessage);
 * }
 * ```
 */
export type ServiceResponse<T> = ServiceSuccess<T> | ServiceError;

/**
 * Create a success response
 * @param data - The successful result data
 * @param message - Optional success message
 */
export function createSuccess<T>(data: T, message?: string): ServiceSuccess<T> {
  return {
    success: true,
    data,
    message,
  };
}

/**
 * Create an error response
 * @param code - Error code for categorization
 * @param message - Technical error message
 * @param userMessage - User-friendly message for UI
 * @param details - Optional additional error details
 */
export function createError(
  code: ServiceErrorCode,
  message: string,
  userMessage: string,
  details?: any
): ServiceError {
  return {
    success: false,
    error: {
      code,
      message,
      userMessage,
      details,
    },
  };
}

/**
 * Handle unexpected errors by wrapping them in ServiceError
 * @param error - The caught error
 * @param defaultUserMessage - Fallback user message if error is unknown
 */
export function handleUnknownError(
  error: unknown,
  defaultUserMessage: string = 'Ocorreu um erro inesperado'
): ServiceError {
  if (__DEV__) {
    console.error('Unexpected error:', error);
  }

  const message = error instanceof Error ? error.message : String(error);
  
  return createError(
    ServiceErrorCode.UNKNOWN_ERROR,
    message,
    defaultUserMessage,
    error
  );
}

/**
 * Check if response is successful (type guard)
 */
export function isSuccess<T>(response: ServiceResponse<T>): response is ServiceSuccess<T> {
  return response.success === true;
}

/**
 * Check if response is an error (type guard)
 */
export function isError<T>(response: ServiceResponse<T>): response is ServiceError {
  return response.success === false;
}

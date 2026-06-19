/**
 * Custom error class for t1yOS SDK errors.
 * Wraps API error responses with code, message, and data.
 */
export class T1YError extends Error {
  /** HTTP status or error code */
  code: number
  /** Response data from server (if any) */
  data: unknown

  constructor(code: number, message: string, data?: unknown) {
    super(message)
    this.name = 'T1YError'
    this.code = code
    this.data = data
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      data: this.data,
    }
  }
}

/**
 * Validation error thrown when configuration parameters are invalid.
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

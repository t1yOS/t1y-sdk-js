import { MIN_APP_ID, API_KEY_LENGTH, SECRET_KEY_LENGTH, OBJECT_ID_PATTERN } from '../constants'
import { ValidationError } from './errors'
import type { T1YOSConfig } from '../types'

/**
 * Validate that the application ID is a valid integer >= MIN_APP_ID.
 */
export function validateAppId(appId: number): void {
  if (!Number.isInteger(appId)) {
    throw new ValidationError('appId must be an integer')
  }
  if (appId < MIN_APP_ID) {
    throw new ValidationError(`appId must be >= ${MIN_APP_ID}`)
  }
}

/**
 * Validate that the API Key is exactly the required length.
 */
export function validateApiKey(apiKey: string): void {
  if (typeof apiKey !== 'string') {
    throw new ValidationError('apiKey must be a string')
  }
  if (apiKey.length !== API_KEY_LENGTH) {
    throw new ValidationError(
      `apiKey must be exactly ${API_KEY_LENGTH} characters (got ${apiKey.length})`
    )
  }
}

/**
 * Validate that the Secret Key is exactly the required length.
 */
export function validateSecretKey(secretKey: string): void {
  if (typeof secretKey !== 'string') {
    throw new ValidationError('secretKey must be a string')
  }
  if (secretKey.length !== SECRET_KEY_LENGTH) {
    throw new ValidationError(
      `secretKey must be exactly ${SECRET_KEY_LENGTH} characters (got ${secretKey.length})`
    )
  }
}

/**
 * Validate the base URL format.
 */
export function validateBaseUrl(baseUrl: string): void {
  if (!/^https?:\/\//.test(baseUrl)) {
    throw new ValidationError('baseUrl must start with "http://" or "https://"')
  }
}

/**
 * Validate all configuration parameters at once.
 */
export function validateInitConfig(config: T1YOSConfig): void {
  if (config.baseUrl !== undefined) {
    validateBaseUrl(config.baseUrl)
  }
  validateAppId(config.appId)
  validateApiKey(config.apiKey)
  validateSecretKey(config.secretKey)

  if (config.version !== undefined && (!Number.isInteger(config.version) || config.version < 0)) {
    throw new ValidationError('version must be a non-negative integer')
  }
}

/**
 * Validate an ObjectID hex string.
 * Returns true if valid, throws otherwise.
 */
export function assertObjectID(idStr: string, name = 'ObjectID'): boolean {
  if (typeof idStr !== 'string') {
    throw new ValidationError(`${name} must be a string`)
  }
  if (!OBJECT_ID_PATTERN.test(idStr)) {
    throw new ValidationError(`Invalid ${name} string: "${idStr}"`)
  }
  return true
}

/**
 * Platform request adapter index.
 *
 * Exports all platform-specific request functions and the dispatcher
 * that selects the correct adapter at runtime.
 */

export { fetchRequest } from './fetch'
export { wxRequest } from './wx'
export { myRequest } from './my'
export { hapRequest } from './hap'

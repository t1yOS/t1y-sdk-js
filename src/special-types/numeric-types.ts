/**
 * Create a Boolean marker. The server converts this to a Go bool.
 */
export function Boolean_(val: boolean): `Boolean(${string})` {
  return `Boolean(${val})`
}

/**
 * Create an Integer marker. The server converts this to int32.
 */
export function Integer(n: number): `Integer(${number})` {
  return `Integer(${n})`
}

/**
 * Create a Bigint marker. The server converts this to int64.
 */
export function Bigint(n: number | bigint): `Bigint(${number})` {
  return `Bigint(${Number(n)})`
}

/**
 * Create a Float marker. The server converts this to float32.
 */
export function Float(n: number): `Float(${number})` {
  return `Float(${n})`
}

/**
 * Create a Double marker. The server converts this to float64.
 */
export function Double(n: number): `Double(${number})` {
  return `Double(${n})`
}

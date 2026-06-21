/**
 * Pure JavaScript AES-256-GCM implementation.
 *
 * This is a fallback for environments that do not have the Web Crypto API
 * (e.g., WeChat Mini Program, Alipay Mini Program, Quick App).
 *
 * Implements:
 * - AES-256 block cipher (14 rounds, 256-bit key)
 * - GCM mode: CTR encryption + GHASH authentication
 *
 * References:
 * - FIPS 197: Advanced Encryption Standard (AES)
 * - NIST SP 800-38D: Galois/Counter Mode (GCM)
 *
 * IMPORTANT: This implementation is NOT constant-time and should only be
 * used as a fallback. In Web browsers and Node.js, the native Web Crypto API
 * implementation in aes.ts is preferred.
 */

// ==================== AES S-Box and Inverse S-Box ====================

const SBOX: number[] = [
  0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
  0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
  0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
  0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
  0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
  0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
  0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
  0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
  0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
  0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
  0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
  0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
  0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
  0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
  0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
  0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16,
]

// Round constants
const RCON: number[] = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36]

// ==================== AES Key Expansion (256-bit key) ====================

/**
 * Expand a 256-bit (32-byte) key into 15 round keys (60 words of 4 bytes each).
 * AES-256 uses 14 rounds, needing 15 round keys (including the initial key).
 */
function keyExpansion256(key: Uint8Array): Uint8Array[] {
  if (key.length !== 32) {
    throw new Error('AES-256 requires a 32-byte key')
  }

  const Nk = 8 // 256-bit key = 8 words
  const Nr = 14 // 14 rounds for AES-256
  const Nb = 4 // 4 words per block

  // Total words = Nb * (Nr + 1) = 4 * 15 = 60
  const totalWords = Nb * (Nr + 1)
  const words: number[] = new Array(totalWords)

  // Copy key into first Nk words
  for (let i = 0; i < Nk; i++) {
    words[i] =
      (key[4 * i]! << 24) | (key[4 * i + 1]! << 16) | (key[4 * i + 2]! << 8) | key[4 * i + 3]!
  }

  // Expand
  for (let i = Nk; i < totalWords; i++) {
    let temp = words[i - 1]!

    if (i % Nk === 0) {
      // RotWord + SubWord + Rcon
      temp = subWord(rotWord(temp)) ^ (RCON[Math.floor(i / Nk) - 1]! << 24)
    } else if (Nk > 6 && i % Nk === 4) {
      // Extra SubWord for AES-256 every 4th iteration after the first Nk
      temp = subWord(temp)
    }

    words[i] = words[i - Nk]! ^ temp
  }

  // Convert to round keys (Uint8Array per round)
  const roundKeys: Uint8Array[] = []
  for (let r = 0; r <= Nr; r++) {
    const rk = new Uint8Array(16)
    for (let j = 0; j < 4; j++) {
      const w = words[r * 4 + j]!
      rk[4 * j] = (w >>> 24) & 0xff
      rk[4 * j + 1] = (w >>> 16) & 0xff
      rk[4 * j + 2] = (w >>> 8) & 0xff
      rk[4 * j + 3] = w & 0xff
    }
    roundKeys.push(rk)
  }

  return roundKeys
}

function rotWord(w: number): number {
  return ((w << 8) | (w >>> 24)) >>> 0
}

function subWord(w: number): number {
  return (
    ((SBOX[(w >>> 24) & 0xff]! << 24) |
      (SBOX[(w >>> 16) & 0xff]! << 16) |
      (SBOX[(w >>> 8) & 0xff]! << 8) |
      (SBOX[w & 0xff]! << 0)) >>>
    0
  )
}

// ==================== AES Block Encrypt ====================

/**
 * Encrypt a single 16-byte block using AES-256.
 */
function aesEncryptBlock(block: Uint8Array, roundKeys: Uint8Array[]): Uint8Array {
  if (block.length !== 16) {
    throw new Error('AES block must be exactly 16 bytes')
  }

  const state: number[][] = [[], [], [], []]

  // Load block into state (column-major order)
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      state[j]![i] = block[i * 4 + j]!
    }
  }

  const Nr = 14 // AES-256

  // Initial AddRoundKey
  addRoundKey(state, roundKeys[0]!)

  // Rounds 1 through Nr-1 (13 rounds)
  for (let round = 1; round < Nr; round++) {
    subBytes(state)
    shiftRows(state)
    mixColumns(state)
    addRoundKey(state, roundKeys[round]!)
  }

  // Final round (no MixColumns)
  subBytes(state)
  shiftRows(state)
  addRoundKey(state, roundKeys[Nr]!)

  // Extract state into output block
  const out = new Uint8Array(16)
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      out[i * 4 + j] = state[j]![i]!
    }
  }

  return out
}

function subBytes(state: number[][]): void {
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      state[i]![j] = SBOX[state[i]![j]!]!
    }
  }
}

function shiftRows(state: number[][]): void {
  for (let i = 1; i < 4; i++) {
    const row = state[i]!
    state[i] = [row[i % 4]!, row[(i + 1) % 4]!, row[(i + 2) % 4]!, row[(i + 3) % 4]!]
  }
}

function mixColumns(state: number[][]): void {
  for (let i = 0; i < 4; i++) {
    const a: number[] = []
    for (let j = 0; j < 4; j++) {
      a[j] = state[j]![i]!
    }

    state[0]![i] = gmul(2, a[0]!) ^ gmul(3, a[1]!) ^ a[2]! ^ a[3]!
    state[1]![i] = a[0]! ^ gmul(2, a[1]!) ^ gmul(3, a[2]!) ^ a[3]!
    state[2]![i] = a[0]! ^ a[1]! ^ gmul(2, a[2]!) ^ gmul(3, a[3]!)
    state[3]![i] = gmul(3, a[0]!) ^ a[1]! ^ a[2]! ^ gmul(2, a[3]!)
  }
}

function addRoundKey(state: number[][], roundKey: Uint8Array): void {
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      state[j]![i] = state[j]![i]! ^ roundKey[i * 4 + j]!
    }
  }
}

/** Galois field multiplication in GF(2^8) */
function gmul(a: number, b: number): number {
  let p = 0
  let aa = a
  let bb = b
  for (let i = 0; i < 8; i++) {
    if (bb & 1) p ^= aa
    const hiBit = aa & 0x80
    aa = (aa << 1) & 0xff
    if (hiBit) aa ^= 0x1b
    bb >>= 1
  }
  return p
}

// ==================== AES-CTR Mode ====================

/**
 * AES-256-CTR encryption/decryption (they are the same operation in CTR mode).
 */
function aesCtr(key: Uint8Array, counter: Uint8Array, data: Uint8Array): Uint8Array {
  const roundKeys = keyExpansion256(key)
  const blockCount = Math.ceil(data.length / 16)
  const output = new Uint8Array(data.length)

  const ctr = new Uint8Array(counter) // Copy counter so we can increment it

  for (let i = 0; i < blockCount; i++) {
    // Encrypt the counter block
    const keystream = aesEncryptBlock(ctr, roundKeys)

    // XOR with plaintext/ciphertext
    const blockLen = Math.min(16, data.length - i * 16)
    for (let j = 0; j < blockLen; j++) {
      output[i * 16 + j] = data[i * 16 + j]! ^ keystream[j]!
    }

    // Increment counter (big-endian, 32-bit last 4 bytes)
    incrementCounter(ctr)
  }

  return output
}

function incrementCounter(ctr: Uint8Array): void {
  // Increment the last 4 bytes as a 32-bit big-endian integer
  for (let i = 15; i >= 12; i--) {
    const val = ctr[i]! + 1
    ctr[i] = val & 0xff
    if (val <= 0xff) break
  }
}

// ==================== 64-bit Big-Endian Helpers ====================

/**
 * Write a 64-bit unsigned integer in big-endian format.
 * Uses Number (not BigInt) for compatibility with ES2017 and older targets.
 * The value must be within Number.MAX_SAFE_INTEGER (2^53 - 1).
 */
function writeUint64BE(buf: Uint8Array, offset: number, value: number): void {
  // High 32 bits
  const hi = Math.floor(value / 0x100000000)
  // Low 32 bits
  const lo = value % 0x100000000
  buf[offset] = (hi >>> 24) & 0xff
  buf[offset + 1] = (hi >>> 16) & 0xff
  buf[offset + 2] = (hi >>> 8) & 0xff
  buf[offset + 3] = hi & 0xff
  buf[offset + 4] = (lo >>> 24) & 0xff
  buf[offset + 5] = (lo >>> 16) & 0xff
  buf[offset + 6] = (lo >>> 8) & 0xff
  buf[offset + 7] = lo & 0xff
}

// ==================== GHASH (GCM Authentication) ====================

/**
 * GHASH: Galois field multiplication-based hash used in GCM.
 *
 * Computes the authentication tag over the AAD (additional authenticated data)
 * and ciphertext using the hash subkey H.
 */
function ghash(h: Uint8Array, aad: Uint8Array, ciphertext: Uint8Array): Uint8Array {
  const blockSize = 16

  // Number of blocks needed
  const aadBlocks = Math.ceil(aad.length / blockSize)
  const ctBlocks = Math.ceil(ciphertext.length / blockSize)
  const totalBlocks = aadBlocks + ctBlocks + 1 // +1 for the length block

  // Initialize Y to zero
  const y = new Uint8Array(blockSize)

  // Process AAD
  for (let i = 0; i < aadBlocks; i++) {
    const block = new Uint8Array(blockSize)
    const offset = i * blockSize
    const len = Math.min(blockSize, aad.length - offset)
    for (let j = 0; j < len; j++) {
      block[j] = aad[offset + j]!
    }
    // XOR with Y, then multiply by H
    for (let j = 0; j < blockSize; j++) {
      block[j] ^= y[j]!
    }
    const mulResult = gfMul(block, h)
    y.set(mulResult)
  }

  // Process ciphertext
  for (let i = 0; i < ctBlocks; i++) {
    const block = new Uint8Array(blockSize)
    const offset = i * blockSize
    const len = Math.min(blockSize, ciphertext.length - offset)
    for (let j = 0; j < len; j++) {
      block[j] = ciphertext[offset + j]!
    }
    // XOR with Y, then multiply by H
    for (let j = 0; j < blockSize; j++) {
      block[j] ^= y[j]!
    }
    const mulResult = gfMul(block, h)
    y.set(mulResult)
  }

  // Process length block: [len(AAD) in bits (64-bit BE)] || [len(C) in bits (64-bit BE)]
  // Using Number instead of BigInt for compatibility with older ES targets.
  // GCM max data size is ~64GB (2^36 bits), well within Number.MAX_SAFE_INTEGER (2^53).
  const lenBlock = new Uint8Array(blockSize)
  const aadBitLen = aad.length * 8
  const ctBitLen = ciphertext.length * 8
  writeUint64BE(lenBlock, 0, aadBitLen)
  writeUint64BE(lenBlock, 8, ctBitLen)
  for (let j = 0; j < blockSize; j++) {
    lenBlock[j] ^= y[j]!
  }
  const tag = gfMul(lenBlock, h)

  return tag
}

/**
 * Galois field multiplication in GF(2^128).
 *
 * Used by GHASH to compute the authentication tag.
 * Operates on 16-byte blocks interpreted as elements of GF(2^128).
 */
function gfMul(x: Uint8Array, y: Uint8Array): Uint8Array {
  const result = new Uint8Array(16)
  const v = new Uint8Array(y) // Copy y so we can shift it

  // R = 0xE1 << 120 (reduction polynomial for GCM)
  // Process each bit of x from LSB to MSB
  for (let byteIdx = 0; byteIdx < 16; byteIdx++) {
    for (let bit = 0; bit < 8; bit++) {
      if ((x[15 - byteIdx]! >> (7 - bit)) & 1) {
        // result ^= v
        for (let k = 0; k < 16; k++) {
          result[k] ^= v[k]!
        }
      }

      // v >>= 1 (shift right, LSB first in GCM convention)
      const lsb = v[15]! & 1
      for (let k = 15; k > 0; k--) {
        v[k] = (v[k]! >> 1) | ((v[k - 1]! & 1) << 7)
      }
      v[0] = v[0]! >> 1

      if (lsb) {
        v[0] ^= 0xe1 // Reduction polynomial applied at the MSB
      }
    }
  }

  return result
}

// ==================== GCM Encrypt / Decrypt ====================

/**
 * AES-256-GCM encryption.
 *
 * @param plaintext - Data to encrypt (Uint8Array)
 * @param key - 32-byte AES-256 key
 * @param nonce - 12-byte nonce/IV
 * @param aad - Additional authenticated data (Uint8Array, can be empty)
 * @returns { ciphertext, tag } where tag is 16 bytes
 */
export function aesGcmEncryptPure(
  plaintext: Uint8Array,
  key: Uint8Array,
  nonce: Uint8Array,
  aad: Uint8Array = new Uint8Array(0)
): { ciphertext: Uint8Array; tag: Uint8Array } {
  if (key.length !== 32) {
    throw new Error('key length must be 32 bytes for AES-256-GCM')
  }
  if (nonce.length !== 12) {
    throw new Error('nonce length must be 12 bytes for AES-256-GCM')
  }

  // Build initial counter block: nonce (12 bytes) || counter (4 bytes, starting at 1)
  // Using 32-bit counter (last 4 bytes of 16-byte block)
  const j0 = new Uint8Array(16)
  j0.set(nonce)
  j0[15] = 1 // Counter starts at 1 (J0 is used for GHASH, counter from 1 for encryption)

  // Encrypt plaintext with AES-CTR starting at J0
  // Actually, GCM uses the initial counter block for the tag, and J0+1 for encryption
  // Let me re-read the spec...

  // GCM uses:
  // - J0 (nonce || counter=1) for the final GHASH XOR
  // - Counter blocks starting from inc32(J0) for encryption
  // Wait, actually the standard says:
  // If len(IV) == 96 bits (12 bytes): J0 = IV || 0^31 || 1
  // Then encryption uses inc32(J0), inc32(inc32(J0)), etc.
  // And the tag is GHASH(...) XOR GCTR(J0, ...)

  // Actually, let me follow the NIST spec more carefully:
  // J0 = IV || 0^31 || 1  (for 96-bit IV)
  // Let inc32(X) increment the last 32 bits of X
  // The ciphertext is GCTR(inc32(J0), P)
  // The tag is GHASH(H, A, C) XOR GCTR(J0, GHASH(H, A, C))

  const roundKeys = keyExpansion256(key)

  // Compute H = AES(K, 0^128)
  const zeroBlock = new Uint8Array(16)
  const h = aesEncryptBlock(zeroBlock, roundKeys)

  // Build J0
  const j0Block = new Uint8Array(16)
  j0Block.set(nonce)
  j0Block[15] = 1 // Counter = 1 for J0

  // Build first encryption counter = inc32(J0)
  const ctrBlock = new Uint8Array(j0Block)
  incrementCounter(ctrBlock)

  // Encrypt plaintext with AES-CTR
  const ciphertext = aesCtr(key, ctrBlock, plaintext)

  // Compute GHASH over AAD and ciphertext
  const s = ghash(h, aad, ciphertext)

  // Compute tag = S XOR GCTR(J0, S)
  const encryptedS = aesCtr(key, j0Block, s) // Using J0 as the initial counter
  const tag = new Uint8Array(16)
  for (let i = 0; i < 16; i++) {
    tag[i] = s[i]! ^ encryptedS[i]!
  }

  return { ciphertext, tag }
}

/**
 * AES-256-GCM decryption.
 *
 * @param ciphertext - Data to decrypt (Uint8Array)
 * @param tag - 16-byte authentication tag
 * @param key - 32-byte AES-256 key
 * @param nonce - 12-byte nonce/IV
 * @param aad - Additional authenticated data (Uint8Array, can be empty)
 * @returns Decrypted plaintext (Uint8Array)
 * @throws {Error} If authentication fails (tag mismatch)
 */
export function aesGcmDecryptPure(
  ciphertext: Uint8Array,
  tag: Uint8Array,
  key: Uint8Array,
  nonce: Uint8Array,
  aad: Uint8Array = new Uint8Array(0)
): Uint8Array {
  if (key.length !== 32) {
    throw new Error('key length must be 32 bytes for AES-256-GCM')
  }
  if (nonce.length !== 12) {
    throw new Error('nonce length must be 12 bytes for AES-256-GCM')
  }
  if (tag.length !== 16) {
    throw new Error('tag length must be 16 bytes for AES-256-GCM')
  }

  const roundKeys = keyExpansion256(key)

  // Compute H = AES(K, 0^128)
  const zeroBlock = new Uint8Array(16)
  const h = aesEncryptBlock(zeroBlock, roundKeys)

  // Build J0
  const j0Block = new Uint8Array(16)
  j0Block.set(nonce)
  j0Block[15] = 1

  // Verify authentication tag FIRST
  const s = ghash(h, aad, ciphertext)
  const encryptedS = aesCtr(key, j0Block, s)
  const expectedTag = new Uint8Array(16)
  for (let i = 0; i < 16; i++) {
    expectedTag[i] = s[i]! ^ encryptedS[i]!
  }

  // Constant-time tag comparison
  let mismatch = 0
  for (let i = 0; i < 16; i++) {
    mismatch |= tag[i]! ^ expectedTag[i]!
  }
  if (mismatch !== 0) {
    throw new Error('AES-256-GCM authentication failed: tag mismatch')
  }

  // Build encryption counter = inc32(J0)
  const ctrBlock = new Uint8Array(j0Block)
  incrementCounter(ctrBlock)

  // Decrypt (CTR mode: decryption is same as encryption)
  return aesCtr(key, ctrBlock, ciphertext)
}

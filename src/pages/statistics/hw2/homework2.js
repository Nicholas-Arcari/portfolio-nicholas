/* global process */
/**
 * Homework #1 - Exercise 2 - From wallet seed to Ethereum address:
 *          hashing, key derivation and cryptographic primitives
 * Sapienza University of Rome - MSc in Cybersecurity (LM-66) - Statistics
 * Nicholas Arcari
 *
 * The pipeline of an Ethereum wallet, written from the standards with no
 * dependencies, so that every intermediate value can be printed and checked
 * against the official test vectors:
 *
 *   mnemonic --BIP-39--> seed --BIP-32 / BIP-44--> private key --secp256k1-->
 *   public key --Keccak-256--> address --EIP-55--> checksummed address
 *
 *   0. Input validation and bytes
 *   1. Hash functions: SHA-256, SHA-512, RIPEMD-160, Keccak-256 and SHA3-256
 *   2. HMAC-SHA512, PBKDF2 and Base58Check
 *   3. secp256k1
 *   4. BIP-39: mnemonic sentence and seed
 *   5. BIP-32 and BIP-44: hierarchical deterministic keys and their paths
 *   6. Ethereum address and EIP-55
 *   7. The whole pipeline and the official test vectors
 *   8. Statistical properties of every step
 *   9. Charts (browser, <canvas>)
 *  10. Printed report and command line
 *
 * Educational code: it follows the standards closely and is checked against
 * their test vectors, but it is not hardened (no constant-time arithmetic,
 * secrets left in memory). Never use it, or this page, with real funds.
 */
import { WORDLIST as ENGLISH_WORDLIST, WORDLIST_SHA256 } from './wordlist.js';

// ---------------------------------------------------------------------------
// 0. Input validation and bytes
// ---------------------------------------------------------------------------

const fail = (message) => {
  throw new RangeError(message);
};

const describe = (v) => (typeof v === 'string' ? JSON.stringify(v.length > 40 ? `${v.slice(0, 40)}...` : v) : String(v));

function assertBytes(name, v, length = null) {
  if (!(v instanceof Uint8Array)) fail(`${name} must be a Uint8Array`);
  if (length !== null && v.length !== length) fail(`${name} must be ${length} bytes long, got ${v.length}`);
}

/** Bytes as lowercase hexadecimal. */
export const toHex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

/** Hexadecimal (an even number of digits, optional 0x) to bytes; anything else is refused. */
export function fromHex(hex) {
  if (typeof hex !== 'string') fail(`hex must be a string, got ${describe(hex)}`);
  const h = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (h.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(h)) fail(`not an even-length hexadecimal string: ${describe(hex)}`);
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = Number.parseInt(h.slice(2 * i, 2 * i + 2), 16);
  return out;
}

/** UTF-8 bytes of a string. */
export const utf8 = (text) => new TextEncoder().encode(text);

/** The concatenation of byte arrays. */
export function concat(...parts) {
  const out = new Uint8Array(parts.reduce((s, p) => s + p.length, 0));
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

/** Big-endian 32-bit integer. */
export const ser32 = (i) => new Uint8Array([(i >>> 24) & 255, (i >>> 16) & 255, (i >>> 8) & 255, i & 255]);

/** Unsigned big-endian integer of 32 bytes. */
export function ser256(n) {
  if (typeof n !== 'bigint' || n < 0n || n >= 1n << 256n) fail('ser256 expects a BigInt in [0, 2^256)');
  return fromHex(n.toString(16).padStart(64, '0'));
}

/** Bytes read as an unsigned big-endian integer. */
export const bytesToBigInt = (bytes) => (bytes.length ? BigInt(`0x${toHex(bytes)}`) : 0n);

/** Number of positions where two byte arrays of the same length differ, bit by bit. */
export function hammingDistance(a, b) {
  let d = 0;
  for (let i = 0; i < a.length; i++) {
    let x = a[i] ^ b[i];
    while (x) {
      x &= x - 1;
      d++;
    }
  }
  return d;
}

// ---------------------------------------------------------------------------
// 1. Hash functions
// ---------------------------------------------------------------------------

// Constants computed exactly from their definitions (integer roots of the
// first primes, the LFSR of Keccak) and checked against the standards.

const K256 = new Int32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

const H256 = new Int32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);

// SHA-512 constants as pairs of 32-bit words: high, low
const K512 = new Int32Array([
  0x428a2f98, 0xd728ae22, 0x71374491, 0x23ef65cd, 0xb5c0fbcf, 0xec4d3b2f, 0xe9b5dba5, 0x8189dbbc,
  0x3956c25b, 0xf348b538, 0x59f111f1, 0xb605d019, 0x923f82a4, 0xaf194f9b, 0xab1c5ed5, 0xda6d8118,
  0xd807aa98, 0xa3030242, 0x12835b01, 0x45706fbe, 0x243185be, 0x4ee4b28c, 0x550c7dc3, 0xd5ffb4e2,
  0x72be5d74, 0xf27b896f, 0x80deb1fe, 0x3b1696b1, 0x9bdc06a7, 0x25c71235, 0xc19bf174, 0xcf692694,
  0xe49b69c1, 0x9ef14ad2, 0xefbe4786, 0x384f25e3, 0x0fc19dc6, 0x8b8cd5b5, 0x240ca1cc, 0x77ac9c65,
  0x2de92c6f, 0x592b0275, 0x4a7484aa, 0x6ea6e483, 0x5cb0a9dc, 0xbd41fbd4, 0x76f988da, 0x831153b5,
  0x983e5152, 0xee66dfab, 0xa831c66d, 0x2db43210, 0xb00327c8, 0x98fb213f, 0xbf597fc7, 0xbeef0ee4,
  0xc6e00bf3, 0x3da88fc2, 0xd5a79147, 0x930aa725, 0x06ca6351, 0xe003826f, 0x14292967, 0x0a0e6e70,
  0x27b70a85, 0x46d22ffc, 0x2e1b2138, 0x5c26c926, 0x4d2c6dfc, 0x5ac42aed, 0x53380d13, 0x9d95b3df,
  0x650a7354, 0x8baf63de, 0x766a0abb, 0x3c77b2a8, 0x81c2c92e, 0x47edaee6, 0x92722c85, 0x1482353b,
  0xa2bfe8a1, 0x4cf10364, 0xa81a664b, 0xbc423001, 0xc24b8b70, 0xd0f89791, 0xc76c51a3, 0x0654be30,
  0xd192e819, 0xd6ef5218, 0xd6990624, 0x5565a910, 0xf40e3585, 0x5771202a, 0x106aa070, 0x32bbd1b8,
  0x19a4c116, 0xb8d2d0c8, 0x1e376c08, 0x5141ab53, 0x2748774c, 0xdf8eeb99, 0x34b0bcb5, 0xe19b48a8,
  0x391c0cb3, 0xc5c95a63, 0x4ed8aa4a, 0xe3418acb, 0x5b9cca4f, 0x7763e373, 0x682e6ff3, 0xd6b2b8a3,
  0x748f82ee, 0x5defb2fc, 0x78a5636f, 0x43172f60, 0x84c87814, 0xa1f0ab72, 0x8cc70208, 0x1a6439ec,
  0x90befffa, 0x23631e28, 0xa4506ceb, 0xde82bde9, 0xbef9a3f7, 0xb2c67915, 0xc67178f2, 0xe372532b,
  0xca273ece, 0xea26619c, 0xd186b8c7, 0x21c0c207, 0xeada7dd6, 0xcde0eb1e, 0xf57d4f7f, 0xee6ed178,
  0x06f067aa, 0x72176fba, 0x0a637dc5, 0xa2c898a6, 0x113f9804, 0xbef90dae, 0x1b710b35, 0x131c471b,
  0x28db77f5, 0x23047d84, 0x32caab7b, 0x40c72493, 0x3c9ebe0a, 0x15c9bebc, 0x431d67c4, 0x9c100d4c,
  0x4cc5d4be, 0xcb3e42b6, 0x597f299c, 0xfc657e2a, 0x5fcb6fab, 0x3ad6faec, 0x6c44198c, 0x4a475817,
]);

const H512 = new Int32Array([
  0x6a09e667, 0xf3bcc908, 0xbb67ae85, 0x84caa73b, 0x3c6ef372, 0xfe94f82b, 0xa54ff53a, 0x5f1d36f1,
  0x510e527f, 0xade682d1, 0x9b05688c, 0x2b3e6c1f, 0x1f83d9ab, 0xfb41bd6b, 0x5be0cd19, 0x137e2179,
]);

/**
 * Merkle-Damgard padding: the message, a 1 bit, zeros, and the length in
 * bits as a big-endian integer of `lengthBytes` bytes (8 for SHA-256, 16 for
 * SHA-512), up to a multiple of the block size. `prefixBytes` counts bytes
 * already hashed before the message (the key block of HMAC).
 */
function mdPad(message, blockSize, lengthBytes, prefixBytes = 0) {
  const total = prefixBytes + message.length;
  const padded = new Uint8Array(Math.ceil((message.length + 1 + lengthBytes) / blockSize) * blockSize);
  padded.set(message);
  padded[message.length] = 0x80;
  let bits = total * 8;
  for (let i = padded.length - 1; i >= padded.length - Math.min(lengthBytes, 7); i--) {
    padded[i] = bits % 256;
    bits = Math.floor(bits / 256);
  }
  return padded;
}

const rotr32 = (x, n) => (x >>> n) | (x << (32 - n));

const W256 = new Int32Array(64);

function sha256Compress(H, block, offset) {
  const W = W256;
  for (let t = 0; t < 16; t++) {
    const o = offset + 4 * t;
    W[t] = (block[o] << 24) | (block[o + 1] << 16) | (block[o + 2] << 8) | block[o + 3];
  }
  for (let t = 16; t < 64; t++) {
    const s0 = rotr32(W[t - 15], 7) ^ rotr32(W[t - 15], 18) ^ (W[t - 15] >>> 3);
    const s1 = rotr32(W[t - 2], 17) ^ rotr32(W[t - 2], 19) ^ (W[t - 2] >>> 10);
    W[t] = (W[t - 16] + s0 + W[t - 7] + s1) | 0;
  }
  let [a, b, c, d, e, f, g, h] = H;
  for (let t = 0; t < 64; t++) {
    const t1 = (h + (rotr32(e, 6) ^ rotr32(e, 11) ^ rotr32(e, 25)) + ((e & f) ^ (~e & g)) + K256[t] + W[t]) | 0;
    const t2 = ((rotr32(a, 2) ^ rotr32(a, 13) ^ rotr32(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
    h = g;
    g = f;
    f = e;
    e = (d + t1) | 0;
    d = c;
    c = b;
    b = a;
    a = (t1 + t2) | 0;
  }
  H[0] = (H[0] + a) | 0;
  H[1] = (H[1] + b) | 0;
  H[2] = (H[2] + c) | 0;
  H[3] = (H[3] + d) | 0;
  H[4] = (H[4] + e) | 0;
  H[5] = (H[5] + f) | 0;
  H[6] = (H[6] + g) | 0;
  H[7] = (H[7] + h) | 0;
}

/** SHA-256 (FIPS 180-4): 32 bytes. BIP-39 takes its checksum from it, Base58Check applies it twice. */
export function sha256(message) {
  assertBytes('message', message);
  const H = Int32Array.from(H256);
  const padded = mdPad(message, 64, 8);
  for (let o = 0; o < padded.length; o += 64) sha256Compress(H, padded, o);
  const out = new Uint8Array(32);
  for (let i = 0; i < 8; i++) out.set(ser32(H[i]), 4 * i);
  return out;
}

const K512H = K512.filter((_, i) => i % 2 === 0);
const K512L = K512.filter((_, i) => i % 2 === 1);
const WH = new Int32Array(80);
const WL = new Int32Array(80);
const TWO32 = 4294967296;

/**
 * One SHA-512 compression of a block given as 32 signed 32-bit integers:
 * every 64-bit word is a pair (high, low), because JavaScript numbers hold
 * 53 bits. Additions carry from the low half into the high half, rotations
 * move bits across the halves.
 */
function sha512CompressWords(H, words) {
  for (let t = 0; t < 16; t++) {
    WH[t] = words[2 * t];
    WL[t] = words[2 * t + 1];
  }
  for (let t = 16; t < 80; t++) {
    // sigma0(x) = rotr(x, 1) ^ rotr(x, 8) ^ (x >>> 7)
    let xh = WH[t - 15];
    let xl = WL[t - 15];
    const s0h = ((xh >>> 1) | (xl << 31)) ^ ((xh >>> 8) | (xl << 24)) ^ (xh >>> 7);
    const s0l = ((xl >>> 1) | (xh << 31)) ^ ((xl >>> 8) | (xh << 24)) ^ ((xl >>> 7) | (xh << 25));
    // sigma1(x) = rotr(x, 19) ^ rotr(x, 61) ^ (x >>> 6)
    xh = WH[t - 2];
    xl = WL[t - 2];
    const s1h = ((xh >>> 19) | (xl << 13)) ^ ((xl >>> 29) | (xh << 3)) ^ (xh >>> 6);
    const s1l = ((xl >>> 19) | (xh << 13)) ^ ((xh >>> 29) | (xl << 3)) ^ ((xl >>> 6) | (xh << 26));
    const lo = (s1l >>> 0) + (WL[t - 7] >>> 0) + (s0l >>> 0) + (WL[t - 16] >>> 0);
    WH[t] = (s1h + WH[t - 7] + s0h + WH[t - 16] + ((lo / TWO32) | 0)) | 0;
    WL[t] = lo | 0;
  }
  let ah = H[0];
  let al = H[1];
  let bh = H[2];
  let bl = H[3];
  let ch = H[4];
  let cl = H[5];
  let dh = H[6];
  let dl = H[7];
  let eh = H[8];
  let el = H[9];
  let fh = H[10];
  let fl = H[11];
  let gh = H[12];
  let gl = H[13];
  let hh = H[14];
  let hl = H[15];
  for (let t = 0; t < 80; t++) {
    // Sigma1(e) = rotr(e, 14) ^ rotr(e, 18) ^ rotr(e, 41)
    const S1h = ((eh >>> 14) | (el << 18)) ^ ((eh >>> 18) | (el << 14)) ^ ((el >>> 9) | (eh << 23));
    const S1l = ((el >>> 14) | (eh << 18)) ^ ((el >>> 18) | (eh << 14)) ^ ((eh >>> 9) | (el << 23));
    // T1 = h + Sigma1(e) + Ch(e, f, g) + K[t] + W[t]
    const t1l = (hl >>> 0) + (S1l >>> 0) + (((el & fl) ^ (~el & gl)) >>> 0) + (K512L[t] >>> 0) + (WL[t] >>> 0);
    const t1h = (hh + S1h + ((eh & fh) ^ (~eh & gh)) + K512H[t] + WH[t] + ((t1l / TWO32) | 0)) | 0;
    // Sigma0(a) = rotr(a, 28) ^ rotr(a, 34) ^ rotr(a, 39)
    const S0h = ((ah >>> 28) | (al << 4)) ^ ((al >>> 2) | (ah << 30)) ^ ((al >>> 7) | (ah << 25));
    const S0l = ((al >>> 28) | (ah << 4)) ^ ((ah >>> 2) | (al << 30)) ^ ((ah >>> 7) | (al << 25));
    // T2 = Sigma0(a) + Maj(a, b, c)
    const t2l = (S0l >>> 0) + (((al & bl) ^ (al & cl) ^ (bl & cl)) >>> 0);
    const t2h = (S0h + ((ah & bh) ^ (ah & ch) ^ (bh & ch)) + ((t2l / TWO32) | 0)) | 0;
    hh = gh;
    hl = gl;
    gh = fh;
    gl = fl;
    fh = eh;
    fl = el;
    const sumE = (dl >>> 0) + (t1l >>> 0);
    eh = (dh + t1h + ((sumE / TWO32) | 0)) | 0;
    el = sumE | 0;
    dh = ch;
    dl = cl;
    ch = bh;
    cl = bl;
    bh = ah;
    bl = al;
    const sumA = (t1l >>> 0) + (t2l >>> 0);
    ah = (t1h + t2h + ((sumA / TWO32) | 0)) | 0;
    al = sumA | 0;
  }
  let lo = (H[1] >>> 0) + (al >>> 0);
  H[0] = (H[0] + ah + ((lo / TWO32) | 0)) | 0;
  H[1] = lo | 0;
  lo = (H[3] >>> 0) + (bl >>> 0);
  H[2] = (H[2] + bh + ((lo / TWO32) | 0)) | 0;
  H[3] = lo | 0;
  lo = (H[5] >>> 0) + (cl >>> 0);
  H[4] = (H[4] + ch + ((lo / TWO32) | 0)) | 0;
  H[5] = lo | 0;
  lo = (H[7] >>> 0) + (dl >>> 0);
  H[6] = (H[6] + dh + ((lo / TWO32) | 0)) | 0;
  H[7] = lo | 0;
  lo = (H[9] >>> 0) + (el >>> 0);
  H[8] = (H[8] + eh + ((lo / TWO32) | 0)) | 0;
  H[9] = lo | 0;
  lo = (H[11] >>> 0) + (fl >>> 0);
  H[10] = (H[10] + fh + ((lo / TWO32) | 0)) | 0;
  H[11] = lo | 0;
  lo = (H[13] >>> 0) + (gl >>> 0);
  H[12] = (H[12] + gh + ((lo / TWO32) | 0)) | 0;
  H[13] = lo | 0;
  lo = (H[15] >>> 0) + (hl >>> 0);
  H[14] = (H[14] + hh + ((lo / TWO32) | 0)) | 0;
  H[15] = lo | 0;
}

const blockWords = new Int32Array(32);

/** One SHA-512 compression of 128 bytes starting at `offset`. */
function sha512Compress(H, block, offset) {
  for (let i = 0; i < 32; i++) {
    const o = offset + 4 * i;
    blockWords[i] = (block[o] << 24) | (block[o + 1] << 16) | (block[o + 2] << 8) | block[o + 3];
  }
  sha512CompressWords(H, blockWords);
}

function sha512Digest(H) {
  const out = new Uint8Array(64);
  for (let i = 0; i < 16; i++) out.set(ser32(H[i]), 4 * i);
  return out;
}

/** Continues a SHA-512 whose state H has already absorbed `prefixBytes` bytes, and returns the digest. */
function sha512Continue(H, message, prefixBytes) {
  const padded = mdPad(message, 128, 16, prefixBytes);
  for (let o = 0; o < padded.length; o += 128) sha512Compress(H, padded, o);
  return sha512Digest(H);
}

/** SHA-512 (FIPS 180-4): 64 bytes. The hash inside HMAC-SHA512, PBKDF2 and BIP-32. */
export function sha512(message) {
  assertBytes('message', message);
  return sha512Continue(Int32Array.from(H512), message, 0);
}

// RIPEMD-160 (Dobbertin, Bosselaers, Preneel, 1996): two parallel lines of
// five rounds; BIP-32 uses it, after SHA-256, for the key fingerprints.
const RMD_RL = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8,
  3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12, 1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14, 5, 6, 2,
  4, 0, 5, 9, 7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13,
];
const RMD_RR = [
  5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12, 6, 11, 3, 7, 0, 13, 5, 10, 14, 15, 8, 12, 4, 9, 1, 2,
  15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4, 13, 8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2, 13, 9, 7, 10, 14,
  12, 15, 10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9, 11,
];
const RMD_SL = [
  11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8, 7, 6, 8, 13, 11, 9, 7, 15, 7, 12, 15, 9, 11, 7, 13, 12,
  11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5, 11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12,
  9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5, 6,
];
const RMD_SR = [
  8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6, 9, 13, 15, 7, 12, 8, 9, 11, 7, 7, 12, 7, 6, 15, 13, 11,
  9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5, 15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8,
  8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13, 11, 11,
];
const RMD_KL = [0x00000000, 0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xa953fd4e];
const RMD_KR = [0x50a28be6, 0x5c4dd124, 0x6d703ef3, 0x7a6d76e9, 0x00000000];

const rotl32 = (x, n) => (x << n) | (x >>> (32 - n));

function rmdF(j, x, y, z) {
  if (j < 16) return x ^ y ^ z;
  if (j < 32) return (x & y) | (~x & z);
  if (j < 48) return (x | ~y) ^ z;
  if (j < 64) return (x & z) | (y & ~z);
  return x ^ (y | ~z);
}

/** RIPEMD-160: 20 bytes. */
export function ripemd160(message) {
  assertBytes('message', message);
  // MD4-style padding: the length is little-endian
  const padded = new Uint8Array(Math.ceil((message.length + 9) / 64) * 64);
  padded.set(message);
  padded[message.length] = 0x80;
  let bits = message.length * 8;
  for (let i = padded.length - 8; i < padded.length - 1; i++) {
    padded[i] = bits % 256;
    bits = Math.floor(bits / 256);
  }
  const h = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];
  const X = new Int32Array(16);
  for (let o = 0; o < padded.length; o += 64) {
    for (let i = 0; i < 16; i++) {
      const p = o + 4 * i;
      X[i] = padded[p] | (padded[p + 1] << 8) | (padded[p + 2] << 16) | (padded[p + 3] << 24);
    }
    let [al, bl, cl, dl, el] = h;
    let [ar, br, cr, dr, er] = h;
    for (let j = 0; j < 80; j++) {
      const r = j >> 4;
      let t = (rotl32((al + rmdF(j, bl, cl, dl) + X[RMD_RL[j]] + RMD_KL[r]) | 0, RMD_SL[j]) + el) | 0;
      al = el;
      el = dl;
      dl = rotl32(cl, 10);
      cl = bl;
      bl = t;
      t = (rotl32((ar + rmdF(79 - j, br, cr, dr) + X[RMD_RR[j]] + RMD_KR[r]) | 0, RMD_SR[j]) + er) | 0;
      ar = er;
      er = dr;
      dr = rotl32(cr, 10);
      cr = br;
      br = t;
    }
    const t = (h[1] + cl + dr) | 0;
    h[1] = (h[2] + dl + er) | 0;
    h[2] = (h[3] + el + ar) | 0;
    h[3] = (h[4] + al + br) | 0;
    h[4] = (h[0] + bl + cr) | 0;
    h[0] = t;
  }
  const out = new Uint8Array(20);
  h.forEach((w, i) => {
    out[4 * i] = w & 255;
    out[4 * i + 1] = (w >>> 8) & 255;
    out[4 * i + 2] = (w >>> 16) & 255;
    out[4 * i + 3] = (w >>> 24) & 255;
  });
  return out;
}

/** HASH160 = RIPEMD-160(SHA-256(x)): the first 4 bytes of a parent key's are a BIP-32 fingerprint. */
export const hash160 = (bytes) => ripemd160(sha256(bytes));

// Keccak-f[1600]: a 5 x 5 array of 64-bit lanes, each stored as two 32-bit
// halves (low, high) at s[2i], s[2i + 1], with i = x + 5y.
const KECCAK_RC = new Int32Array([
  0x00000000, 0x00000001, 0x00000000, 0x00008082, 0x80000000, 0x0000808a, 0x80000000, 0x80008000,
  0x00000000, 0x0000808b, 0x00000000, 0x80000001, 0x80000000, 0x80008081, 0x80000000, 0x00008009,
  0x00000000, 0x0000008a, 0x00000000, 0x00000088, 0x00000000, 0x80008009, 0x00000000, 0x8000000a,
  0x00000000, 0x8000808b, 0x80000000, 0x0000008b, 0x80000000, 0x00008089, 0x80000000, 0x00008003,
  0x80000000, 0x00008002, 0x80000000, 0x00000080, 0x00000000, 0x0000800a, 0x80000000, 0x8000000a,
  0x80000000, 0x80008081, 0x80000000, 0x00008080, 0x00000000, 0x80000001, 0x80000000, 0x80008008,
]);
// rotation offsets r[x + 5y] of the rho step
const KECCAK_ROT = [0, 1, 62, 28, 27, 36, 44, 6, 55, 20, 3, 10, 43, 25, 39, 41, 45, 15, 21, 8, 18, 2, 61, 56, 14];

const keccakC = new Int32Array(10);
const keccakB = new Int32Array(50);

/** The permutation Keccak-f[1600]: 24 rounds of theta, rho, pi, chi, iota. */
function keccakF(s) {
  const C = keccakC;
  const B = keccakB;
  for (let round = 0; round < 24; round++) {
    // theta: every lane is xored with the parities of two nearby columns
    for (let x = 0; x < 5; x++) {
      C[2 * x] = s[2 * x] ^ s[2 * x + 10] ^ s[2 * x + 20] ^ s[2 * x + 30] ^ s[2 * x + 40];
      C[2 * x + 1] = s[2 * x + 1] ^ s[2 * x + 11] ^ s[2 * x + 21] ^ s[2 * x + 31] ^ s[2 * x + 41];
    }
    for (let x = 0; x < 5; x++) {
      const p = 2 * ((x + 4) % 5);
      const q = 2 * ((x + 1) % 5);
      const dl = C[p] ^ ((C[q] << 1) | (C[q + 1] >>> 31));
      const dh = C[p + 1] ^ ((C[q + 1] << 1) | (C[q] >>> 31));
      for (let y = 0; y < 25; y += 5) {
        s[2 * (x + y)] ^= dl;
        s[2 * (x + y) + 1] ^= dh;
      }
    }
    // rho and pi: lane (x, y) is rotated and moved to (y, 2x + 3y)
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 5; y++) {
        const i = x + 5 * y;
        const n = KECCAK_ROT[i];
        const lo = s[2 * i];
        const hi = s[2 * i + 1];
        let rl = lo;
        let rh = hi;
        if (n >= 32) {
          rl = hi;
          rh = lo;
        }
        const m = n % 32;
        if (m) {
          const tl = (rl << m) | (rh >>> (32 - m));
          rh = (rh << m) | (rl >>> (32 - m));
          rl = tl;
        }
        const j = y + 5 * ((2 * x + 3 * y) % 5);
        B[2 * j] = rl;
        B[2 * j + 1] = rh;
      }
    }
    // chi: the only non-linear step, row by row
    for (let y = 0; y < 25; y += 5) {
      for (let x = 0; x < 5; x++) {
        const a = 2 * (x + y);
        const b = 2 * (((x + 1) % 5) + y);
        const c = 2 * (((x + 2) % 5) + y);
        s[a] = B[a] ^ (~B[b] & B[c]);
        s[a + 1] = B[a + 1] ^ (~B[b + 1] & B[c + 1]);
      }
    }
    // iota: a round constant breaks the symmetry between rounds
    s[0] ^= KECCAK_RC[2 * round + 1];
    s[1] ^= KECCAK_RC[2 * round];
  }
}

/**
 * Sponge with rate 136 bytes (capacity 512 bits) and 32 bytes of output.
 * `suffix` is the first padding byte: 0x01 for the original Keccak, which
 * Ethereum uses, 0x06 for SHA3-256 as standardized in FIPS 202, where two
 * extra domain-separation bits 01 precede the pad10*1 padding.
 */
function keccakSponge256(message, suffix) {
  assertBytes('message', message);
  const rate = 136;
  const s = new Int32Array(50);
  const blocks = Math.floor(message.length / rate) + 1;
  const padded = new Uint8Array(blocks * rate);
  padded.set(message);
  padded[message.length] ^= suffix;
  padded[padded.length - 1] ^= 0x80;
  for (let o = 0; o < padded.length; o += rate) {
    for (let i = 0; i < rate / 4; i++) {
      const p = o + 4 * i;
      s[i] ^= padded[p] | (padded[p + 1] << 8) | (padded[p + 2] << 16) | (padded[p + 3] << 24);
    }
    keccakF(s);
  }
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) out[i] = (s[i >> 2] >>> (8 * (i & 3))) & 255;
  return out;
}

/** Keccak-256: the hash of Ethereum (addresses, EIP-55, Solidity's keccak256). */
export const keccak256 = (message) => keccakSponge256(message, 0x01);

/** SHA3-256 (FIPS 202): same permutation and rate as Keccak-256, different padding, different digests. */
export const sha3_256 = (message) => keccakSponge256(message, 0x06);

// ---------------------------------------------------------------------------
// 2. HMAC-SHA512, PBKDF2 and Base58Check
// ---------------------------------------------------------------------------

/**
 * HMAC-SHA512 with the key already absorbed: H((K ^ opad) || H((K ^ ipad) || m)).
 * The states after the two key blocks are computed once, so that each call
 * costs only the message blocks: PBKDF2 calls it 2048 times with one key.
 */
export function hmacSha512Keyed(key) {
  assertBytes('key', key);
  const k = key.length > 128 ? sha512(key) : key;
  const ipad = new Uint8Array(128).fill(0x36);
  const opad = new Uint8Array(128).fill(0x5c);
  for (let i = 0; i < k.length; i++) {
    ipad[i] ^= k[i];
    opad[i] ^= k[i];
  }
  const inner = Int32Array.from(H512);
  sha512Compress(inner, ipad, 0);
  const outer = Int32Array.from(H512);
  sha512Compress(outer, opad, 0);
  return (message) => {
    const innerDigest = sha512Continue(Int32Array.from(inner), message, 128);
    return sha512Continue(Int32Array.from(outer), innerDigest, 128);
  };
}

/** HMAC-SHA512 (RFC 2104): a keyed hash, 64 bytes. BIP-32 derives every key with it. */
export const hmacSha512 = (key, message) => hmacSha512Keyed(key)(message);

/**
 * PBKDF2 with HMAC-SHA512 (RFC 8018): T = U1 ^ U2 ^ ... ^ Uc, with
 * U1 = HMAC(P, S || INT(i)) and Uj = HMAC(P, Uj-1). The iterations make every
 * guess of the password c times more expensive. Returns dkLen bytes.
 *
 * From U2 on the message is always 64 bytes, so each HMAC is exactly two
 * compressions of a block whose padding never changes: the loop works on
 * 32-bit words, with no allocation, which keeps BIP-39's 2048 iterations fast.
 */
export function pbkdf2Sha512(password, salt, iterations, dkLen) {
  assertBytes('password', password);
  assertBytes('salt', salt);
  if (!Number.isSafeInteger(iterations) || iterations < 1) fail(`iterations must be a positive integer, got ${describe(iterations)}`);
  if (!Number.isSafeInteger(dkLen) || dkLen < 1 || dkLen > 1024) fail(`dkLen must be an integer in [1, 1024], got ${describe(dkLen)}`);
  const k = password.length > 128 ? sha512(password) : password;
  const ipad = new Uint8Array(128).fill(0x36);
  const opad = new Uint8Array(128).fill(0x5c);
  for (let i = 0; i < k.length; i++) {
    ipad[i] ^= k[i];
    opad[i] ^= k[i];
  }
  const inner = Int32Array.from(H512);
  sha512Compress(inner, ipad, 0);
  const outer = Int32Array.from(H512);
  sha512Compress(outer, opad, 0);
  const prf = hmacSha512Keyed(password);
  // a 64-byte message after the 128-byte key block: 0x80, zeros, length 1536 bits
  const block = new Int32Array(32);
  block[16] = 0x80000000 | 0;
  block[31] = (128 + 64) * 8;
  const H = new Int32Array(16);
  const out = new Uint8Array(Math.ceil(dkLen / 64) * 64);
  for (let index = 1; index * 64 <= out.length; index++) {
    const u1 = prf(concat(salt, ser32(index)));
    const t = new Int32Array(16);
    for (let i = 0; i < 16; i++) {
      const o = 4 * i;
      t[i] = (u1[o] << 24) | (u1[o + 1] << 16) | (u1[o + 2] << 8) | u1[o + 3];
      block[i] = t[i];
    }
    for (let j = 1; j < iterations; j++) {
      H.set(inner);
      sha512CompressWords(H, block);
      for (let i = 0; i < 16; i++) block[i] = H[i];
      H.set(outer);
      sha512CompressWords(H, block);
      for (let i = 0; i < 16; i++) {
        block[i] = H[i];
        t[i] ^= H[i];
      }
    }
    for (let i = 0; i < 16; i++) out.set(ser32(t[i]), (index - 1) * 64 + 4 * i);
  }
  return out.slice(0, dkLen);
}

const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/** Base58: no 0, O, I or l, which are easy to confuse; leading zero bytes become leading 1s. */
export function base58(bytes) {
  let n = bytesToBigInt(bytes);
  let out = '';
  while (n > 0n) {
    out = BASE58[Number(n % 58n)] + out;
    n /= 58n;
  }
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) out = `1${out}`;
  return out;
}

/** Base58Check: the payload, then 4 bytes of SHA-256(SHA-256(payload)) as checksum. */
export const base58Check = (payload) => base58(concat(payload, sha256(sha256(payload)).slice(0, 4)));

// ---------------------------------------------------------------------------
// 3. secp256k1
// ---------------------------------------------------------------------------

/** The curve y^2 = x^3 + 7 over F_p of Bitcoin and Ethereum (SEC 2, 2000): prime order n, cofactor 1. */
export const SECP256K1 = Object.freeze({
  p: 2n ** 256n - 2n ** 32n - 977n,
  n: 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n,
  a: 0n,
  b: 7n,
  Gx: 0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n,
  Gy: 0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n,
});
const FP = SECP256K1.p;
const CURVE_N = SECP256K1.n;

const modP = (a) => {
  const r = a % FP;
  return r >= 0n ? r : r + FP;
};

/** Inverse modulo m with the extended Euclidean algorithm. */
function invMod(a, m) {
  let [r0, r1] = [((a % m) + m) % m, m];
  let [s0, s1] = [1n, 0n];
  while (r1 !== 0n) {
    const q = r0 / r1;
    [r0, r1] = [r1, r0 - q * r1];
    [s0, s1] = [s1, s0 - q * s1];
  }
  if (r0 !== 1n) fail('not invertible');
  return ((s0 % m) + m) % m;
}

// Affine points are objects { x, y } (null is the point at infinity); inside
// the arithmetic they are in Jacobian coordinates [X, Y, Z], meaning
// (X/Z^2, Y/Z^3): no inversion at every step. Z = 0 is the point at infinity.
const INFINITY_J = Object.freeze([0n, 1n, 0n]);

function jDouble([X, Y, Z]) {
  if (Z === 0n || Y === 0n) return INFINITY_J;
  const YY = modP(Y * Y);
  const S = modP(4n * X * YY);
  const M = modP(3n * X * X); // a = 0
  const X3 = modP(M * M - 2n * S);
  return [X3, modP(M * (S - X3) - 8n * YY * YY), modP(2n * Y * Z)];
}

/** P (Jacobian) + Q (affine, { x, y }). */
function jAddAffine(P, Q) {
  const [X1, Y1, Z1] = P;
  if (Z1 === 0n) return [Q.x, Q.y, 1n];
  const Z1Z1 = modP(Z1 * Z1);
  const U2 = modP(Q.x * Z1Z1);
  const S2 = modP(Q.y * Z1 * Z1Z1);
  const H = modP(U2 - X1);
  const r = modP(S2 - Y1);
  if (H === 0n) return r === 0n ? jDouble(P) : INFINITY_J;
  const HH = modP(H * H);
  const HHH = modP(H * HH);
  const V = modP(X1 * HH);
  const X3 = modP(r * r - HHH - 2n * V);
  return [X3, modP(r * (V - X3) - Y1 * HHH), modP(Z1 * H)];
}

function toAffine([X, Y, Z]) {
  if (Z === 0n) return null;
  const zi = invMod(Z, FP);
  const zi2 = modP(zi * zi);
  return { x: modP(X * zi2), y: modP(Y * zi2 * zi) };
}

/** Inverts many values with one inversion (Montgomery's trick). */
function batchInvert(values) {
  const prefix = [];
  let acc = 1n;
  for (const v of values) {
    prefix.push(acc);
    acc = modP(acc * v);
  }
  let inv = invMod(acc, FP);
  const out = new Array(values.length);
  for (let i = values.length - 1; i >= 0; i--) {
    out[i] = modP(inv * prefix[i]);
    inv = modP(inv * values[i]);
  }
  return out;
}

// Fixed-base table for kG: d * 16^w * G for every window w (64 of 4 bits)
// and digit d = 1..15, in affine form. Built once, it turns kG into at most
// 64 additions instead of about 256 doublings and 128 additions.
let gTable = null;

function generatorTable() {
  if (gTable) return gTable;
  const jacobian = [];
  let base = { x: SECP256K1.Gx, y: SECP256K1.Gy };
  for (let w = 0; w < 64; w++) {
    let acc = [base.x, base.y, 1n];
    jacobian.push(acc);
    for (let d = 2; d <= 15; d++) {
      acc = jAddAffine(acc, base);
      jacobian.push(acc);
    }
    base = toAffine(jDouble(jDouble(jDouble(jDouble([base.x, base.y, 1n])))));
  }
  const inverses = batchInvert(jacobian.map(([, , Z]) => Z));
  gTable = jacobian.map(([X, Y], i) => {
    const zi2 = modP(inverses[i] * inverses[i]);
    return { x: modP(X * zi2), y: modP(Y * zi2 * inverses[i]) };
  });
  return gTable;
}

/** kG for a scalar k in [1, n - 1], as an affine point { x, y }. */
export function multiplyG(k) {
  if (typeof k !== 'bigint' || k <= 0n || k >= CURVE_N) fail('the scalar must be a BigInt in [1, n - 1]');
  const table = generatorTable();
  let R = INFINITY_J;
  for (let w = 0; w < 64; w++) {
    const d = Number((k >> BigInt(4 * w)) & 15n);
    if (d) R = jAddAffine(R, table[15 * w + d - 1]);
  }
  return toAffine(R);
}

/** P + Q for affine points (null is the point at infinity). */
export function addPoints(P, Q) {
  if (P === null) return Q;
  if (Q === null) return P;
  return toAffine(jAddAffine([P.x, P.y, 1n], Q));
}

export const isOnSecp256k1 = ({ x, y }) => modP(y * y - x * x * x - 7n) === 0n;

/** SEC 1 encodings: 04 || x || y (65 bytes), or 02/03 || x (33 bytes, the prefix gives the parity of y). */
export const encodeUncompressed = ({ x, y }) => concat([4], ser256(x), ser256(y));
export const encodeCompressed = ({ x, y }) => concat([y % 2n === 0n ? 2 : 3], ser256(x));

/** The point of a compressed key: y = (x^3 + 7)^((p + 1) / 4), since p = 3 (mod 4). */
export function decodeCompressed(bytes) {
  assertBytes('compressed key', bytes, 33);
  if (bytes[0] !== 2 && bytes[0] !== 3) fail('a compressed key starts with 02 or 03');
  const x = bytesToBigInt(bytes.slice(1));
  if (x >= FP) fail('x is not a field element');
  const y2 = modP(x * x * x + 7n);
  let y = 1n;
  let base = y2;
  let e = (FP + 1n) / 4n;
  while (e > 0n) {
    if (e & 1n) y = modP(y * base);
    base = modP(base * base);
    e >>= 1n;
  }
  if (modP(y * y) !== y2) fail('x is not the abscissa of a curve point');
  if (Number(y & 1n) !== bytes[0] - 2) y = FP - y;
  return { x, y };
}

// ---------------------------------------------------------------------------
// 4. BIP-39: mnemonic sentence and seed
// ---------------------------------------------------------------------------

/** The official English wordlist: 2048 words, so that each word encodes 11 bits. */
export const WORDLIST = ENGLISH_WORDLIST;

/** Number of words allowed by BIP-39, from 128 to 256 bits of entropy. */
export const MNEMONIC_LENGTHS = Object.freeze([12, 15, 18, 21, 24]);

/** A public test mnemonic (Hardhat, Foundry): every development tool knows its accounts. Never use it for real funds. */
export const TEST_MNEMONIC = 'test test test test test test test test test test test junk';

/**
 * The sentence the page and the command line start from, drawn once at random with a
 * cryptographic generator for this homework, so that every reader sees the same values.
 * Its seed, keys and addresses were checked against ethers 6.13.5. It belongs to no wallet.
 */
export const DEFAULT_MNEMONIC = 'myself place force amazing chuckle decide choose fold master cloth card coast';

/** The address of DEFAULT_MNEMONIC on m/44'/60'/0'/0/0, as ethers 6.13.5 computes it. */
export const DEFAULT_ADDRESS = '0xf92c424EF6fC99E0253289c51298628cf4cd7A86';

const WORD_INDEX = new Map(WORDLIST.map((w, i) => [w, i]));
let wordlistChecked = false;

/** Refuses to run if the wordlist is not exactly the official one. */
function checkWordlist() {
  if (wordlistChecked) return;
  if (toHex(sha256(utf8(`${WORDLIST.join('\n')}\n`))) !== WORDLIST_SHA256 || WORD_INDEX.size !== 2048) {
    fail('the BIP-39 wordlist is not the official one');
  }
  wordlistChecked = true;
}

const bitString = (bytes) => Array.from(bytes, (b) => b.toString(2).padStart(8, '0')).join('');

/** BIP-39 entropy (16, 20, 24, 28 or 32 bytes) to words: entropy || first ENT/32 bits of SHA-256, in groups of 11 bits. */
export function entropyToMnemonic(entropy) {
  checkWordlist();
  assertBytes('entropy', entropy);
  if (![16, 20, 24, 28, 32].includes(entropy.length)) fail('the entropy must be 128, 160, 192, 224 or 256 bits');
  const cs = entropy.length / 4;
  const bits = bitString(entropy) + bitString(sha256(entropy)).slice(0, cs);
  const words = [];
  for (let i = 0; i < bits.length; i += 11) words.push(WORDLIST[Number.parseInt(bits.slice(i, i + 11), 2)]);
  return words.join(' ');
}

/** The words of a sentence as BIP-39 wants them: Unicode NFKD, lower case, single spaces. */
export const normalizeMnemonic = (text) => String(text).normalize('NFKD').toLowerCase().trim().split(/\s+/).filter(Boolean);

/**
 * Checks a sentence the way a wallet does, step by step: number of words,
 * every word in the list, then the checksum. Returns every intermediate
 * value, and `error` names the first check that fails.
 */
export function analyzeMnemonic(text) {
  checkWordlist();
  const words = normalizeMnemonic(text);
  const result = { words, count: words.length, sentence: words.join(' '), unknown: [], indices: [], bits: '', entropy: null, checksum: null, expectedChecksum: null, valid: false, error: null };
  if (!words.length) return { ...result, error: 'empty' };
  words.forEach((w, i) => {
    if (!WORD_INDEX.has(w)) result.unknown.push({ position: i + 1, word: w });
  });
  if (result.unknown.length) return { ...result, error: 'unknown-word' };
  if (!MNEMONIC_LENGTHS.includes(words.length)) return { ...result, error: 'length' };
  result.indices = words.map((w) => WORD_INDEX.get(w));
  result.bits = result.indices.map((i) => i.toString(2).padStart(11, '0')).join('');
  const entBits = (words.length * 11 * 32) / 33;
  const entropy = new Uint8Array(entBits / 8);
  for (let i = 0; i < entropy.length; i++) entropy[i] = Number.parseInt(result.bits.slice(8 * i, 8 * i + 8), 2);
  result.entropy = entropy;
  result.checksum = result.bits.slice(entBits);
  result.expectedChecksum = bitString(sha256(entropy)).slice(0, entBits / 32);
  result.valid = result.checksum === result.expectedChecksum;
  if (!result.valid) result.error = 'checksum';
  return result;
}

/**
 * BIP-39 seed: PBKDF2-HMAC-SHA512 with the sentence as password, "mnemonic"
 * followed by the optional passphrase as salt, 2048 iterations, 64 bytes.
 * Both strings are normalized to NFKD first, so the same words typed on
 * different keyboards give the same seed.
 */
export function mnemonicToSeed(sentence, passphrase = '') {
  if (typeof sentence !== 'string' || typeof passphrase !== 'string') fail('sentence and passphrase must be strings');
  return pbkdf2Sha512(utf8(sentence.normalize('NFKD')), utf8(`mnemonic${passphrase.normalize('NFKD')}`), 2048, 64);
}

/** Random bytes from the browser's or Node's cryptographic generator: the only random step of a wallet. */
export function secureRandomBytes(length) {
  const out = new Uint8Array(length);
  const webCrypto = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (webCrypto && typeof webCrypto.getRandomValues === 'function') return webCrypto.getRandomValues(out);
  // eslint-disable-next-line no-undef
  if (typeof require === 'function') return require('crypto').randomFillSync(out);
  return fail('no cryptographic random generator available');
}

/** A new random mnemonic of 12 to 24 words. */
export function generateMnemonic(words = 12) {
  if (!MNEMONIC_LENGTHS.includes(words)) fail(`a mnemonic has ${MNEMONIC_LENGTHS.join(', ')} words`);
  return entropyToMnemonic(secureRandomBytes((words * 11 * 32) / 33 / 8));
}

// ---------------------------------------------------------------------------
// 5. BIP-32 and BIP-44: hierarchical deterministic keys and their paths
// ---------------------------------------------------------------------------

/** Indices from 2^31 up are hardened: written 44' or 44h. */
export const HARDENED = 0x80000000;

const MASTER_SECRET = utf8('Bitcoin seed');

const fingerprintOf = (publicKey) => hash160(publicKey).slice(0, 4);

function makeNode({ depth, index, parentFingerprint, chainCode, privateKey }) {
  const point = multiplyG(privateKey);
  return { depth, index, parentFingerprint, chainCode, privateKey, point, publicKey: encodeCompressed(point) };
}

/**
 * Master node: I = HMAC-SHA512(key = "Bitcoin seed", data = seed); the left
 * 32 bytes are the master private key, the right 32 the chain code.
 */
export function masterKey(seed) {
  assertBytes('seed', seed);
  if (seed.length < 16 || seed.length > 64) fail('a BIP-32 seed has 16 to 64 bytes');
  const I = hmacSha512(MASTER_SECRET, seed);
  const k = bytesToBigInt(I.slice(0, 32));
  if (k === 0n || k >= CURVE_N) fail('invalid master key (probability below 2^-127): use another seed');
  return { node: makeNode({ depth: 0, index: 0, parentFingerprint: new Uint8Array(4), chainCode: I.slice(32), privateKey: k }), I };
}

/**
 * Private child derivation, CKDpriv. Hardened (i >= 2^31): HMAC over
 * 0x00 || k || i, so the child needs the parent's private key. Normal: HMAC
 * over the parent's public key || i, so the child public key can also be
 * derived from the parent's extended public key alone. In both cases
 * k_i = (IL + k) mod n and the chain code is IR.
 */
export function deriveChild(parent, index) {
  if (!Number.isSafeInteger(index) || index < 0 || index > 0xffffffff) fail(`a child index is an integer in [0, 2^32), got ${describe(index)}`);
  const hardened = index >= HARDENED;
  const data = hardened ? concat([0], ser256(parent.privateKey), ser32(index)) : concat(parent.publicKey, ser32(index));
  const I = hmacSha512(parent.chainCode, data);
  const IL = bytesToBigInt(I.slice(0, 32));
  const k = (IL + parent.privateKey) % CURVE_N;
  // BIP-32 asks to skip to the next index in this case, with probability below 2^-127
  if (IL >= CURVE_N || k === 0n) fail(`index ${index} gives an invalid key: BIP-32 skips to the next one`);
  const node = makeNode({ depth: parent.depth + 1, index, parentFingerprint: fingerprintOf(parent.publicKey), chainCode: I.slice(32), privateKey: k });
  return { node, hardened, data, I, IL };
}

/** Public child derivation, CKDpub, for normal indices only: K_i = IL*G + K. */
export function deriveChildPublic(parent, index) {
  if (!Number.isSafeInteger(index) || index < 0 || index >= HARDENED) fail('public derivation exists only for normal indices, below 2^31');
  const I = hmacSha512(parent.chainCode, concat(parent.publicKey, ser32(index)));
  const IL = bytesToBigInt(I.slice(0, 32));
  if (IL >= CURVE_N) fail(`index ${index} gives an invalid key: BIP-32 skips to the next one`);
  const point = addPoints(multiplyG(IL), parent.point);
  if (point === null) fail(`index ${index} gives the point at infinity: BIP-32 skips to the next one`);
  return { depth: parent.depth + 1, index, parentFingerprint: fingerprintOf(parent.publicKey), chainCode: I.slice(32), point, publicKey: encodeCompressed(point), IL };
}

const VERSION_XPRV = ser32(0x0488ade4);
const VERSION_XPUB = ser32(0x0488b21e);

/** Extended key in Base58Check: version, depth, parent fingerprint, child index, chain code, key. */
export function serializeNode(node, isPrivate) {
  return base58Check(
    concat(
      isPrivate ? VERSION_XPRV : VERSION_XPUB,
      [node.depth],
      node.parentFingerprint,
      ser32(node.index),
      node.chainCode,
      isPrivate ? concat([0], ser256(node.privateKey)) : node.publicKey,
    ),
  );
}

/** Deepest path accepted: BIP-44 uses five levels, test vectors up to six. */
export const MAX_PATH_DEPTH = 10;

/**
 * Parses a derivation path such as m/44'/60'/0'/0/0 (h or H also mark a
 * hardened index). Anything else is refused, with the reason.
 */
export function parsePath(text) {
  const t = String(text).trim();
  if (!/^m(\/\d{1,10}['hH]?)*$/.test(t)) fail(`not a derivation path: ${describe(text)}`);
  const parts = t.split('/').slice(1);
  if (parts.length > MAX_PATH_DEPTH) fail(`a path has at most ${MAX_PATH_DEPTH} levels`);
  return parts.map((part) => {
    const hardened = /['hH]$/.test(part);
    const value = Number(hardened ? part.slice(0, -1) : part);
    if (!Number.isSafeInteger(value) || value >= HARDENED) fail(`index ${part} is too large: at most 2^31 - 1`);
    return { label: hardened ? `${value}'` : String(value), value, hardened, index: hardened ? value + HARDENED : value };
  });
}

/** The node at the end of a path, with every level on the way. */
export function derivePath(seed, path) {
  const levels = parsePath(path);
  const master = masterKey(seed);
  const steps = [];
  let node = master.node;
  for (const level of levels) {
    const step = deriveChild(node, level.index);
    steps.push({ ...level, ...step });
    node = step.node;
  }
  return { master, steps, node };
}

/** BIP-44: m / purpose' / coin_type' / account' / change / address_index; Ethereum is coin type 60. */
export const ETHEREUM_COIN_TYPE = 60;

/** The paths of popular wallets for the i-th address, as templates with {i}. */
export const PATH_PRESETS = Object.freeze([
  Object.freeze({ id: 'bip44', template: "m/44'/60'/0'/0/{i}" }), // MetaMask, Rabby, Rainbow, Trezor, Exodus
  Object.freeze({ id: 'ledgerLive', template: "m/44'/60'/{i}'/0/0" }), // Ledger Live
  Object.freeze({ id: 'ledgerLegacy', template: "m/44'/60'/0'/{i}" }), // older Ledger and MyEtherWallet
]);

export const pathFor = (presetId, i) => {
  const preset = PATH_PRESETS.find((p) => p.id === presetId);
  if (!preset) fail(`unknown path preset ${describe(presetId)}`);
  if (!Number.isSafeInteger(i) || i < 0 || i >= HARDENED) fail(`an address index is an integer in [0, 2^31), got ${describe(i)}`);
  return preset.template.replace('{i}', String(i));
};

export const DEFAULT_PATH = pathFor('bip44', 0);

// ---------------------------------------------------------------------------
// 6. Ethereum address and EIP-55
// ---------------------------------------------------------------------------

/** The address: the last 20 bytes of Keccak-256 of the 64 bytes x || y of the public key. */
export function publicKeyToAddress(point) {
  const xy = concat(ser256(point.x), ser256(point.y));
  const hash = keccak256(xy);
  return { xy, hash, bytes: hash.slice(12), address: `0x${toHex(hash.slice(12))}` };
}

const HEX_LETTER = /[a-f]/;

/**
 * EIP-55: hash the lowercase hexadecimal address (as ASCII text, without
 * 0x) with Keccak-256; each letter of the address becomes uppercase when the
 * corresponding hexadecimal digit of the hash is 8 or more. The case of the
 * letters carries about 15 bits of checksum without changing the address.
 */
export function toChecksumAddress(address) {
  const lower = String(address).toLowerCase().replace(/^0x/, '');
  if (!/^[0-9a-f]{40}$/.test(lower)) fail(`not a 20-byte hexadecimal address: ${describe(address)}`);
  const hash = toHex(keccak256(utf8(lower)));
  const chars = lower.split('').map((c, i) => {
    const nibble = Number.parseInt(hash[i], 16);
    const letter = HEX_LETTER.test(c);
    return { char: c, nibble, letter, upper: letter && nibble >= 8 };
  });
  return { lower: `0x${lower}`, hash, chars, address: `0x${chars.map((c) => (c.upper ? c.char.toUpperCase() : c.char)).join('')}` };
}

/**
 * Checks a typed address. All lowercase or all uppercase carries no
 * checksum (valid: null); mixed case must match EIP-55 exactly.
 */
export function checkAddress(text) {
  const t = String(text).trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(t)) return { format: false, valid: false };
  const body = t.slice(2);
  const expected = toChecksumAddress(t);
  const letters = (body.match(/[a-fA-F]/g) || []).length;
  if (body === body.toLowerCase() || body === body.toUpperCase()) return { format: true, valid: null, letters, expected: expected.address };
  return { format: true, valid: t === expected.address, letters, expected: expected.address };
}

// ---------------------------------------------------------------------------
// 7. The whole pipeline and the official test vectors
// ---------------------------------------------------------------------------

/**
 * Seed -> BIP-32 / BIP-44 private key -> secp256k1 public key -> Keccak-256
 * address -> EIP-55 checksummed address, with every intermediate value: the
 * part of the pipeline after BIP-39, which a page can recompute when only
 * the path changes, without repeating the 2048 iterations of PBKDF2.
 */
export function keysFromSeed(seed, path) {
  const levels = parsePath(path);
  const derivation = derivePath(seed, path);
  const { node } = derivation;
  const address = publicKeyToAddress(node.point);
  const checksum = toChecksumAddress(address.address);
  const steps = derivation.steps;
  const parentNode = steps.length ? (steps.length > 1 ? steps[steps.length - 2].node : derivation.master.node) : null;
  return {
    seed,
    path,
    levels,
    master: derivation.master,
    steps,
    node,
    parentNode,
    privateKey: ser256(node.privateKey),
    publicKey: { point: node.point, compressed: node.publicKey, uncompressed: encodeUncompressed(node.point) },
    address,
    checksum,
    extended: {
      xprv: serializeNode(node, true),
      xpub: serializeNode(node, false),
      parentXpub: parentNode ? serializeNode(parentNode, false) : null,
    },
  };
}

/**
 * Mnemonic -> BIP-39 seed -> BIP-32 / BIP-44 private key -> secp256k1 public
 * key -> Keccak-256 address -> EIP-55 checksummed address, with every
 * intermediate value. If the sentence is not valid the pipeline stops there,
 * as a wallet would.
 */
export function walletPipeline({ mnemonic = DEFAULT_MNEMONIC, passphrase = '', path = DEFAULT_PATH } = {}) {
  const analysis = analyzeMnemonic(mnemonic);
  if (!analysis.valid) return { ok: false, stage: 'mnemonic', analysis };
  try {
    parsePath(path);
  } catch (error) {
    return { ok: false, stage: 'path', analysis, error: error.message };
  }
  const seed = mnemonicToSeed(analysis.sentence, passphrase);
  return { ok: true, analysis, passphrase, ...keysFromSeed(seed, path) };
}

/** Accounts of the public test mnemonic on m/44'/60'/0'/0/i (Hardhat, Foundry and many tutorials list them). */
export const TEST_ACCOUNTS = Object.freeze([
  Object.freeze({ index: 0, address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', privateKey: 'ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' }),
  Object.freeze({ index: 1, address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', privateKey: '59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d' }),
  Object.freeze({ index: 2, address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', privateKey: '5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a' }),
]);

/** Official BIP-39 test vectors (trezor/python-mnemonic, passphrase "TREZOR"): entropy, sentence, seed, master xprv. */
export const BIP39_VECTORS = Object.freeze([
  ['00000000000000000000000000000000', 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about', 'c55257c360c07c72029aebc1b53c05ed0362ada38ead3e3e9efa3708e53495531f09a6987599d18264c1e1c92f2cf141630c7a3c4ab7c81b2f001698e7463b04', 'xprv9s21ZrQH143K3h3fDYiay8mocZ3afhfULfb5GX8kCBdno77K4HiA15Tg23wpbeF1pLfs1c5SPmYHrEpTuuRhxMwvKDwqdKiGJS9XFKzUsAF'],
  ['7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f', 'legal winner thank year wave sausage worth useful legal winner thank yellow', '2e8905819b8723fe2c1d161860e5ee1830318dbf49a83bd451cfb8440c28bd6fa457fe1296106559a3c80937a1c1069be3a3a5bd381ee6260e8d9739fce1f607', 'xprv9s21ZrQH143K2gA81bYFHqU68xz1cX2APaSq5tt6MFSLeXnCKV1RVUJt9FWNTbrrryem4ZckN8k4Ls1H6nwdvDTvnV7zEXs2HgPezuVccsq'],
  ['80808080808080808080808080808080', 'letter advice cage absurd amount doctor acoustic avoid letter advice cage above', 'd71de856f81a8acc65e6fc851a38d4d7ec216fd0796d0a6827a3ad6ed5511a30fa280f12eb2e47ed2ac03b5c462a0358d18d69fe4f985ec81778c1b370b652a8', 'xprv9s21ZrQH143K2shfP28KM3nr5Ap1SXjz8gc2rAqqMEynmjt6o1qboCDpxckqXavCwdnYds6yBHZGKHv7ef2eTXy461PXUjBFQg6PrwY4Gzq'],
  ['ffffffffffffffffffffffffffffffff', 'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong', 'ac27495480225222079d7be181583751e86f571027b0497b5b5d11218e0a8a13332572917f0f8e5a589620c6f15b11c61dee327651a14c34e18231052e48c069', 'xprv9s21ZrQH143K2V4oox4M8Zmhi2Fjx5XK4Lf7GKRvPSgydU3mjZuKGCTg7UPiBUD7ydVPvSLtg9hjp7MQTYsW67rZHAXeccqYqrsx8LcXnyd'],
]);

/** Official BIP-32 test vector 1: seed 000102...0f, path, extended public and private key. */
export const BIP32_VECTOR = Object.freeze({
  seed: '000102030405060708090a0b0c0d0e0f',
  chains: Object.freeze([
    ['m', 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8', 'xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi'],
    ["m/0'", 'xpub68Gmy5EdvgibQVfPdqkBBCHxA5htiqg55crXYuXoQRKfDBFA1WEjWgP6LHhwBZeNK1VTsfTFUHCdrfp1bgwQ9xv5ski8PX9rL2dZXvgGDnw', 'xprv9uHRZZhk6KAJC1avXpDAp4MDc3sQKNxDiPvvkX8Br5ngLNv1TxvUxt4cV1rGL5hj6KCesnDYUhd7oWgT11eZG7XnxHrnYeSvkzY7d2bhkJ7'],
    ["m/0'/1", 'xpub6ASuArnXKPbfEwhqN6e3mwBcDTgzisQN1wXN9BJcM47sSikHjJf3UFHKkNAWbWMiGj7Wf5uMash7SyYq527Hqck2AxYysAA7xmALppuCkwQ', 'xprv9wTYmMFdV23N2TdNG573QoEsfRrWKQgWeibmLntzniatZvR9BmLnvSxqu53Kw1UmYPxLgboyZQaXwTCg8MSY3H2EU4pWcQDnRnrVA1xe8fs'],
    ["m/0'/1/2'", 'xpub6D4BDPcP2GT577Vvch3R8wDkScZWzQzMMUm3PWbmWvVJrZwQY4VUNgqFJPMM3No2dFDFGTsxxpG5uJh7n7epu4trkrX7x7DogT5Uv6fcLW5', 'xprv9z4pot5VBttmtdRTWfWQmoH1taj2axGVzFqSb8C9xaxKymcFzXBDptWmT7FwuEzG3ryjH4ktypQSAewRiNMjANTtpgP4mLTj34bhnZX7UiM'],
    ["m/0'/1/2'/2", 'xpub6FHa3pjLCk84BayeJxFW2SP4XRrFd1JYnxeLeU8EqN3vDfZmbqBqaGJAyiLjTAwm6ZLRQUMv1ZACTj37sR62cfN7fe5JnJ7dh8zL4fiyLHV', 'xprvA2JDeKCSNNZky6uBCviVfJSKyQ1mDYahRjijr5idH2WwLsEd4Hsb2Tyh8RfQMuPh7f7RtyzTtdrbdqqsunu5Mm3wDvUAKRHSC34sJ7in334'],
    ["m/0'/1/2'/2/1000000000", 'xpub6H1LXWLaKsWFhvm6RVpEL9P4KfRZSW7abD2ttkWP3SSQvnyA8FSVqNTEcYFgJS2UaFcxupHiYkro49S8yGasTvXEYBVPamhGW6cFJodrTHy', 'xprvA41z7zogVVwxVSgdKUHDy1SKmdb533PjDz7J6N6mV6uS3ze1ai8FHa8kmHScGpWmj4WggLyQjgPie1rFSruoUihUZREPSL39UNdE3BBDu76'],
  ]),
});

/** EIP-55 test cases from the specification: all caps, all lower, mixed. */
export const EIP55_VECTORS = Object.freeze([
  '0x52908400098527886E0F7030069857D2E4169EE7',
  '0x8617E340B3D01FA5F11F306F4090FD50E238070D',
  '0xde709f2102306220921060314715629080e2fb77',
  '0x27b1fdb04752bbc536007a920d24acb045561c26',
  '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
  '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
  '0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB',
  '0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb',
]);

/** Known digests of the hash functions, from their standards and reference implementations. */
export const HASH_VECTORS = Object.freeze([
  ['SHA-256("abc")', () => toHex(sha256(utf8('abc'))), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'],
  ['SHA-512("abc")', () => toHex(sha512(utf8('abc'))), 'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f'],
  ['HMAC-SHA512, RFC 4231 case 1', () => toHex(hmacSha512(new Uint8Array(20).fill(0x0b), utf8('Hi There'))), '87aa7cdea5ef619d4ff0b4241a1d6cb02379f4e2ce4ec2787ad0b30545e17cdedaa833b7d6b8a702038b274eaea3f4e4be9d914eeb61f1702e696c203a126854'],
  ['PBKDF2-HMAC-SHA512("password", "salt", 1)', () => toHex(pbkdf2Sha512(utf8('password'), utf8('salt'), 1, 64)), '867f70cf1ade02cff3752599a3a53dc4af34c7a669815ae5d513554e1c8cf252c02d470a285a0501bad999bfe943c08f050235d7d68b1da55e63f73b60a57fce'],
  ['RIPEMD-160("abc")', () => toHex(ripemd160(utf8('abc'))), '8eb208f7e05d987a9b044a8e98c6b087f15a0bfc'],
  ['Keccak-256("")', () => toHex(keccak256(new Uint8Array(0))), 'c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470'],
  ['SHA3-256("")', () => toHex(sha3_256(new Uint8Array(0))), 'a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a'],
]);

/**
 * Recomputes every official test vector with the code above. Returns one
 * row per check: { group, check, subject, name, expected, actual, ok }, where
 * `check` and `subject` let a page describe the row in its own language and
 * `name` is the English description printed by the command line.
 */
export function verifyVectors() {
  const rows = [];
  const add = (group, check, subject, name, expected, compute) => {
    let actual;
    try {
      actual = compute();
    } catch (error) {
      actual = `error: ${error.message}`;
    }
    rows.push({ group, check, subject, name, expected, actual, ok: actual === expected });
  };
  for (const [name, compute, expected] of HASH_VECTORS) add('hash', 'digest', name, name, expected, compute);
  BIP39_VECTORS.forEach(([entropy, sentence, seed, xprv], i) => {
    const n = `#${i + 1}`;
    add('bip39', 'entropyToWords', n, `${n} entropy -> words`, sentence, () => entropyToMnemonic(fromHex(entropy)));
    add('bip39', 'wordsToSeed', n, `${n} words + "TREZOR" -> seed`, seed, () => toHex(mnemonicToSeed(sentence, 'TREZOR')));
    add('bip39', 'seedToMaster', n, `${n} seed -> master xprv`, xprv, () => serializeNode(masterKey(fromHex(seed)).node, true));
  });
  const seed = fromHex(BIP32_VECTOR.seed);
  for (const [path, xpub, xprv] of BIP32_VECTOR.chains) {
    add('bip32', 'xprv', path, `${path} xprv`, xprv, () => serializeNode(derivePath(seed, path).node, true));
    add('bip32', 'xpub', path, `${path} xpub`, xpub, () => serializeNode(derivePath(seed, path).node, false));
  }
  for (const account of TEST_ACCOUNTS) {
    const path = pathFor('bip44', account.index);
    let pipeline = null;
    const run = () => pipeline || (pipeline = walletPipeline({ mnemonic: TEST_MNEMONIC, path }));
    add('ethereum', 'address', path, `test mnemonic, ${path}`, account.address, () => run().checksum.address);
    add('ethereum', 'privateKey', path, `test mnemonic, ${path}, private key`, account.privateKey, () => toHex(run().privateKey));
  }
  for (const address of EIP55_VECTORS) add('eip55', 'checksum', address, address, address, () => toChecksumAddress(address).address);
  return rows;
}

// ---------------------------------------------------------------------------
// 8. Statistical properties of every step
// ---------------------------------------------------------------------------

/**
 * Sample sizes of the statistical exploration. The inputs come from a
 * seeded generator, so the page, the downloadable program and the command
 * line print the same numbers; they are random and independent, so unlike
 * Exercise 1 the tests are inferential: what they say about the sample,
 * they say about the function.
 */
export const SAMPLES = Object.freeze({
  mnemonics: 1000, // random 12-word sentences: frequency of every word
  sequences: 20000, // random sequences of 12 words: how many pass the checksum
  wordTypos: 20000, // one word changed in a valid sentence: how many still pass
  seeds: 64, // PBKDF2 seeds (2048 iterations each): bit balance
  seedPairs: 32, // seeds of two sentences whose entropy differs in one bit
  keys: 500, // BIP-32 children m/44'/60'/0'/0/i of the test sentence
  keyPairs: 200, // private keys differing in one bit: their public keys
  keccakInputs: 16, // Keccak-256 inputs of 64 bytes, each with all 512 bits flipped in turn
  addressTypos: 50000, // single-character typos of checksummed addresses
  permutations: 200, // permutations of the exact test of the index-key correlation
});

export const SIGNIFICANCE = 0.05;

/** Seed of the generator of the exploration's inputs. */
export const EXPLORE_SEED = 2026;

/** Seeded generator (mulberry32): the same numbers everywhere. */
export function prng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const randomBytesFrom = (rand, length) => {
  const out = new Uint8Array(length);
  for (let i = 0; i < length; i++) out[i] = Math.floor(rand() * 256);
  return out;
};

function logGamma(z) {
  // Lanczos approximation, g = 7
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  const w = z - 1;
  let x = c[0];
  for (let i = 1; i < 9; i++) x += c[i] / (w + i);
  const t = w + 7.5;
  return 0.5 * Math.log(2 * Math.PI) + (w + 0.5) * Math.log(t) - t + Math.log(x);
}

/** Regularized upper incomplete gamma Q(s, x): series below s + 1, continued fraction above. */
function gammaQ(s, x) {
  if (!(s > 0) || !(x >= 0)) return NaN;
  if (x === 0) return 1;
  const front = Math.exp(-x + s * Math.log(x) - logGamma(s));
  if (x < s + 1) {
    let term = 1 / s;
    let total = term;
    for (let n = 1; n < 1000; n++) {
      term *= x / (s + n);
      total += term;
      if (Math.abs(term) < Math.abs(total) * 1e-15) break;
    }
    return Math.max(0, 1 - total * front);
  }
  const tiny = 1e-300;
  let b = x + 1 - s;
  let c = 1 / tiny;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i < 1000; i++) {
    const an = -i * (i - s);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < tiny) d = tiny;
    c = b + an / c;
    if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < 1e-15) break;
  }
  return Math.min(1, front * h);
}

/** P(X >= chi2) for a chi-square variable with df degrees of freedom. */
export const chiSquarePValue = (chi2, df) => (df > 0 && chi2 >= 0 ? gammaQ(df / 2, chi2 / 2) : NaN);

/** Probability that |Z| > z for a standard normal Z. */
export const twoSidedNormalTail = (z) => gammaQ(0.5, (z * z) / 2);

const finish = (test) => ({ ...test, verdict: test.pValue < SIGNIFICANCE ? 'reject' : 'notReject', alpha: SIGNIFICANCE });

/** Binomial test of a rate against p, normal approximation with continuity correction (valid here: n p (1 - p) is large). */
export function binomialTest(successes, trials, p) {
  const mean = trials * p;
  const sd = Math.sqrt(trials * p * (1 - p));
  const z = sd > 0 ? (Math.abs(successes - mean) - 0.5 > 0 ? Math.sign(successes - mean) * (Math.abs(successes - mean) - 0.5) : 0) / sd : 0;
  return finish({ kind: 'binomial', successes, trials, expectedRate: p, rate: successes / trials, z, pValue: twoSidedNormalTail(z) });
}

/** Exact two-sided Poisson test of a count of rare events against its expectation. */
export function poissonTest(observed, expected) {
  const lower = gammaQ(observed + 1, expected); // P(X <= observed)
  const upper = observed === 0 ? 1 : 1 - gammaQ(observed, expected); // P(X >= observed)
  return finish({ kind: 'poisson', observed, expected, pValue: Math.min(1, 2 * Math.min(lower, upper)) });
}

/**
 * Chi-square goodness of fit of counts against probabilities. Neighbouring
 * classes are merged until each expects at least 5 observations (Cochran),
 * so the chi-square approximation holds.
 */
export function goodnessOfFit(counts, probabilities) {
  const N = counts.reduce((s, c) => s + c, 0);
  const merged = [];
  let o = 0;
  let e = 0;
  counts.forEach((c, i) => {
    o += c;
    e += probabilities[i] * N;
    if (e >= 5) {
      merged.push([o, e]);
      o = 0;
      e = 0;
    }
  });
  if (merged.length && (o > 0 || e > 0)) {
    merged[merged.length - 1][0] += o;
    merged[merged.length - 1][1] += e;
  }
  const chi2 = merged.reduce((s, [obs, exp]) => s + (obs - exp) ** 2 / exp, 0);
  const df = merged.length - 1;
  return finish({ kind: 'chi2', N, classes: merged.length, df, chi2, pValue: df > 0 ? chiSquarePValue(chi2, df) : NaN });
}

/** Binomial(n, 1/2) probabilities, the distribution of the distance between two independent random strings of n bits. */
function binomialHalf(n) {
  const out = new Array(n + 1);
  let logC = 0;
  for (let k = 0; k <= n; k++) {
    out[k] = Math.exp(logC - n * Math.LN2);
    logC += Math.log((n - k) / (k + 1));
  }
  return out;
}

/** Binomial(n, p) probabilities. */
function binomialProbabilities(n, p) {
  const out = [];
  for (let k = 0; k <= n; k++) out.push(Math.exp(logGamma(n + 1) - logGamma(k + 1) - logGamma(n - k + 1) + k * Math.log(p) + (n - k) * Math.log(1 - p)));
  return out;
}

/**
 * Share of ones at every bit position of a list of equally long byte arrays,
 * with a z-score per position against 1/2 and the global test
 * sum(z^2) ~ chi-square(positions): for an ideal function every bit is an
 * independent fair coin.
 */
function bitBalance(samples, bits) {
  const N = samples.length;
  const ones = new Array(bits).fill(0);
  for (const s of samples) {
    for (let j = 0; j < bits; j++) ones[j] += (s[j >> 3] >> (7 - (j & 7))) & 1;
  }
  const fractions = ones.map((c) => c / N);
  const z = ones.map((c) => (c - N / 2) / Math.sqrt(N / 4));
  const z2 = z.reduce((s, v) => s + v * v, 0);
  const total = ones.reduce((s, c) => s + c, 0);
  return {
    N,
    bits,
    fractions,
    z,
    beyond3: z.filter((v) => Math.abs(v) > 3).length,
    expectedBeyond3: bits * twoSidedNormalTail(3),
    global: finish({ kind: 'chi2', chi2: z2, df: bits, pValue: chiSquarePValue(z2, bits) }),
    overall: binomialTest(total, N * bits, 0.5),
  };
}

/**
 * Distances between pairs of n-bit strings that should behave like
 * independent random strings: mean, standard deviation and the goodness of
 * fit against Binomial(n, 1/2).
 */
function distanceTest(distances, n) {
  const N = distances.length;
  const mean = distances.reduce((s, d) => s + d, 0) / N;
  const variance = distances.reduce((s, d) => s + (d - mean) ** 2, 0) / Math.max(1, N - 1);
  const counts = new Array(n + 1).fill(0);
  for (const d of distances) counts[d]++;
  const probabilities = binomialHalf(n);
  const zMean = (mean - n / 2) / (Math.sqrt(n / 4) / Math.sqrt(N));
  return {
    N,
    n,
    mean,
    sd: Math.sqrt(variance),
    expectedMean: n / 2,
    expectedSd: Math.sqrt(n) / 2,
    min: Math.min(...distances),
    max: Math.max(...distances),
    counts,
    expected: probabilities.map((q) => q * N),
    mean_test: finish({ kind: 'z', mean, expectedMean: n / 2, z: zMean, pValue: twoSidedNormalTail(zMean) }),
    fit: goodnessOfFit(counts, probabilities),
  };
}

/** Number of bits set in a 32-bit integer. */
function popcount(v) {
  let x = v - ((v >>> 1) & 0x55555555);
  x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
  return Math.imul((x + (x >>> 4)) & 0x0f0f0f0f, 0x01010101) >>> 24;
}

function shuffle(array, rand) {
  for (let t = array.length - 1; t > 0; t--) {
    const r = Math.floor(rand() * (t + 1));
    const tmp = array[t];
    array[t] = array[r];
    array[r] = tmp;
  }
}

/**
 * Correlation phi between every bit of an input index and every bit of an
 * output, with an exact global test by permutation: N sum(phi^2) is
 * recomputed after reassigning the outputs to the indices at random.
 */
function* indexCorrelation(indices, outputs, outputBits, sims, rand) {
  const N = indices.length;
  const inputBits = Math.max(1, Math.floor(Math.log2(Math.max(...indices))) + 1);
  const words = outputBits / 32;
  // outputs as 32-bit words, bit j of the output = bit (31 - j % 32) of word j / 32
  const W = outputs.map((bytes) => Int32Array.from({ length: words }, (_, w) => (bytes[4 * w] << 24) | (bytes[4 * w + 1] << 16) | (bytes[4 * w + 2] << 8) | bytes[4 * w + 3]));
  const outBit = (t, j) => (W[t][j >> 5] >>> (31 - (j & 31))) & 1;
  const n1 = Array.from({ length: inputBits }, (_, i) => indices.filter((k) => (k >>> i) & 1).length);
  const m1 = Array.from({ length: outputBits }, (_, j) => {
    let c = 0;
    for (let t = 0; t < N; t++) c += outBit(t, j);
    return c;
  });
  const den = n1.map((a) => m1.map((b) => Math.sqrt(a * (N - a) * b * (N - b))));
  const both = Array.from({ length: inputBits }, () => new Array(outputBits).fill(0));
  const count = (order) => {
    for (let i = 0; i < inputBits; i++) both[i].fill(0);
    for (let t = 0; t < N; t++) {
      const out = W[order ? order[t] : t];
      for (let a = indices[t]; a !== 0; a &= a - 1) {
        const i = 31 - Math.clz32(a & -a);
        const row = both[i];
        for (let w = 0; w < words; w++) {
          for (let x = out[w]; x !== 0; x &= x - 1) row[32 * w + 31 - (31 - Math.clz32(x & -x))]++;
        }
      }
    }
  };
  const phi = (i, j) => (den[i][j] === 0 ? null : (N * both[i][j] - n1[i] * m1[j]) / den[i][j]);
  const threshold = 3 / Math.sqrt(N - 1);
  yield;
  count(null);
  const values = [];
  let statistic = 0;
  let above = 0;
  let maxAbs = 0;
  for (let i = 0; i < inputBits; i++) {
    const row = [];
    for (let j = 0; j < outputBits; j++) {
      const r = phi(i, j);
      row.push(r);
      if (r === null) continue;
      statistic += N * r * r;
      maxAbs = Math.max(maxAbs, Math.abs(r));
      if (Math.abs(r) > threshold) above++;
    }
    values.push(row);
  }
  let asExtreme = 0;
  let aboveTotal = 0;
  const order = Int32Array.from({ length: N }, (_, t) => t);
  for (let s = 0; s < sims; s++) {
    shuffle(order, rand);
    count(order);
    let stat = 0;
    for (let i = 0; i < inputBits; i++) {
      for (let j = 0; j < outputBits; j++) {
        const r = phi(i, j);
        if (r === null) continue;
        stat += N * r * r;
        if (Math.abs(r) > threshold) aboveTotal++;
      }
    }
    if (stat >= statistic) asExtreme++;
    yield;
  }
  return {
    kind: 'permutation',
    inputBits,
    outputBits,
    values,
    threshold,
    maxAbs,
    above,
    expectedAbove: aboveTotal / sims,
    statistic,
    sims,
    pValue: (1 + asExtreme) / (1 + sims),
    verdict: (1 + asExtreme) / (1 + sims) < SIGNIFICANCE ? 'reject' : 'notReject',
  };
}

/**
 * The BIP-39 check of a 12-word sentence given as word indices, without
 * strings: the 132 bits are 128 of entropy and 4 of checksum, which must be
 * the first 4 bits of SHA-256(entropy). Used by the simulations, which run
 * it tens of thousands of times.
 */
function twelveWordsValid(indices) {
  const entropy = new Uint8Array(16);
  let acc = 0;
  let bits = 0;
  let k = 0;
  for (let w = 0; w < 12; w++) {
    acc = (acc << 11) | indices[w];
    bits += 11;
    while (bits >= 8 && k < 16) {
      entropy[k++] = (acc >>> (bits - 8)) & 255;
      bits -= 8;
      acc &= (1 << bits) - 1;
    }
  }
  return (sha256(entropy)[0] >>> 4) === (indices[11] & 15);
}

const flipBit = (bytes, j) => {
  const out = Uint8Array.from(bytes);
  out[j >> 3] ^= 1 << (7 - (j & 7));
  return out;
};

/**
 * The statistical exploration, as a generator that yields between units of
 * work (a page can run it in slices, a worker or the command line in one
 * go). One section per step of the pipeline.
 */
export function* exploreSteps({ seed = EXPLORE_SEED } = {}) {
  checkWordlist();
  const rand = prng(seed);
  const result = { samples: SAMPLES, seed };

  // --- BIP-39: words and checksum ---------------------------------------
  const wordCounts = new Array(2048).fill(0);
  const checksumCounts = new Array(16).fill(0);
  const validSentences = [];
  for (let s = 0; s < SAMPLES.mnemonics; s++) {
    const entropy = randomBytesFrom(rand, 16);
    const sentence = entropyToMnemonic(entropy);
    const indices = sentence.split(' ').map((w) => WORD_INDEX.get(w));
    for (const i of indices) wordCounts[i]++;
    checksumCounts[indices[11] & 15]++;
    if (validSentences.length < 2000) validSentences.push(indices);
    if (s % 100 === 0) yield;
  }
  let validRandom = 0;
  for (let s = 0; s < SAMPLES.sequences; s++) {
    const indices = Array.from({ length: 12 }, () => Math.floor(rand() * 2048));
    if (twelveWordsValid(indices)) validRandom++;
    if (s % 250 === 0) yield;
  }
  let validTypos = 0;
  for (let s = 0; s < SAMPLES.wordTypos; s++) {
    const indices = validSentences[s % validSentences.length].slice();
    const position = Math.floor(rand() * 12);
    let replacement = Math.floor(rand() * 2047);
    if (replacement >= indices[position]) replacement++;
    indices[position] = replacement;
    if (twelveWordsValid(indices)) validTypos++;
    if (s % 250 === 0) yield;
  }
  // a changed word among the first 11 changes the entropy: the 4-bit
  // checksum then matches with probability 1/16. A changed last word keeps
  // the entropy for the 15 words that differ only in the checksum bits
  // (always rejected) and changes it for the other 2032, of which exactly one
  // in sixteen carries the right checksum: 127 out of 2047.
  const typoRate = (11 / 12) * (1 / 16) + (1 / 12) * (127 / 2047);
  result.bip39 = {
    words: { counts: wordCounts, test: goodnessOfFit(wordCounts, new Array(2048).fill(1 / 2048)) },
    checksumNibble: { counts: checksumCounts, test: goodnessOfFit(checksumCounts, new Array(16).fill(1 / 16)) },
    randomSequences: binomialTest(validRandom, SAMPLES.sequences, 1 / 16),
    wordTypos: { ...binomialTest(validTypos, SAMPLES.wordTypos, typoRate), detected: 1 - validTypos / SAMPLES.wordTypos },
  };
  yield;

  // --- Seed: PBKDF2-HMAC-SHA512 -----------------------------------------
  const seeds = [];
  for (let s = 0; s < SAMPLES.seeds; s++) {
    seeds.push(mnemonicToSeed(entropyToMnemonic(randomBytesFrom(rand, 16))));
    yield;
  }
  const seedDistances = [];
  for (let s = 0; s < SAMPLES.seedPairs; s++) {
    const entropy = randomBytesFrom(rand, 16);
    const flipped = flipBit(entropy, Math.floor(rand() * 128));
    const first = mnemonicToSeed(entropyToMnemonic(entropy));
    yield; // one PBKDF2 per slice: each costs 2048 HMAC-SHA512
    seedDistances.push(hammingDistance(first, mnemonicToSeed(entropyToMnemonic(flipped))));
    yield;
  }
  result.seed = { bits: bitBalance(seeds, 512), avalanche: distanceTest(seedDistances, 512) };

  // --- BIP-32 keys, secp256k1 public keys, addresses ------------------------
  const account = derivePath(mnemonicToSeed(TEST_MNEMONIC), "m/44'/60'/0'/0").node;
  const privateKeys = [];
  const points = [];
  const addresses = [];
  for (let i = 0; i < SAMPLES.keys; i++) {
    const child = deriveChild(account, i).node;
    privateKeys.push(ser256(child.privateKey));
    points.push(child.point);
    addresses.push(publicKeyToAddress(child.point).bytes);
    if (i % 5 === 0) yield;
  }
  const siblingDistances = privateKeys.slice(1).map((k, i) => hammingDistance(k, privateKeys[i]));
  const correlation = yield* indexCorrelation(Array.from({ length: SAMPLES.keys }, (_, i) => i), privateKeys, 256, SAMPLES.permutations, rand);
  result.bip32 = {
    path: "m/44'/60'/0'/0/i",
    bits: bitBalance(privateKeys, 256),
    siblings: distanceTest(siblingDistances, 256),
    correlation,
  };

  const xs = points.map((P) => ser256(P.x));
  const ys = points.map((P) => ser256(P.y));
  const odd = points.filter((P) => P.y & 1n).length;
  const pointDistances = [];
  for (let s = 0; s < SAMPLES.keyPairs; s++) {
    const k = bytesToBigInt(randomBytesFrom(rand, 32)) % (CURVE_N - 1n) + 1n;
    const k2 = k ^ (1n << BigInt(Math.floor(rand() * 255)));
    if (k2 === 0n || k2 >= CURVE_N) continue;
    pointDistances.push(hammingDistance(encodeUncompressed(multiplyG(k)).slice(1), encodeUncompressed(multiplyG(k2)).slice(1)));
    if (s % 10 === 0) yield;
  }
  let homomorphism = 0;
  const trials = 100;
  for (let s = 0; s < trials; s++) {
    const k1 = bytesToBigInt(randomBytesFrom(rand, 32)) % (CURVE_N - 2n) + 1n;
    const k2 = bytesToBigInt(randomBytesFrom(rand, 32)) % (CURVE_N - 2n) + 1n;
    const sumK = (k1 + k2) % CURVE_N;
    if (sumK === 0n) continue;
    const S = addPoints(multiplyG(k1), multiplyG(k2));
    const T = multiplyG(sumK);
    if (S && S.x === T.x && S.y === T.y) homomorphism++;
    if (s % 10 === 9) yield;
  }
  result.secp256k1 = {
    parity: binomialTest(odd, points.length, 0.5),
    bitsX: bitBalance(xs, 256),
    bitsY: bitBalance(ys, 256),
    avalanche: distanceTest(pointDistances, 512),
    homomorphism: { trials, holds: homomorphism },
  };

  // --- Keccak-256 and the addresses ----------------------------------------
  const firstHex = new Array(16).fill(0);
  const byteCounts = new Array(256).fill(0);
  for (const a of addresses) {
    firstHex[a[0] >> 4]++;
    for (const b of a) byteCounts[b]++;
  }
  const keccakDistances = [];
  const perOutput = new Array(256).fill(0);
  const perInput = new Array(512).fill(0);
  const blocks = new Array(32 * 32).fill(0); // 16 x 8 cells of the SAC matrix in each block
  const versusSha3 = [];
  for (let s = 0; s < SAMPLES.keccakInputs; s++) {
    const input = randomBytesFrom(rand, 64);
    const base = keccak256(input);
    versusSha3.push(hammingDistance(base, sha3_256(input)));
    for (let j = 0; j < 512; j++) {
      const h = keccak256(flipBit(input, j));
      let d = 0;
      for (let b = 0; b < 32; b++) {
        let x = base[b] ^ h[b];
        if (!x) continue;
        d += popcount(x);
        for (let bit = 7; x; bit--) {
          if (x & 0x80) {
            const out = 8 * b + (7 - bit);
            perOutput[out]++;
            blocks[32 * (j >> 4) + (out >> 3)]++;
          }
          x = (x << 1) & 0xff;
        }
      }
      perInput[j] += d;
      keccakDistances.push(d);
    }
    yield;
  }
  const pairs = SAMPLES.keccakInputs * 512;
  const rateTest = (counts, measurements) => {
    const z = counts.map((c) => (c - measurements / 2) / Math.sqrt(measurements / 4));
    const z2 = z.reduce((s, v) => s + v * v, 0);
    return { rates: counts.map((c) => c / measurements), z, beyond3: z.filter((v) => Math.abs(v) > 3).length, expectedBeyond3: counts.length * twoSidedNormalTail(3), global: finish({ kind: 'chi2', chi2: z2, df: counts.length, pValue: chiSquarePValue(z2, counts.length) }) };
  };
  const blockMeasurements = SAMPLES.keccakInputs * 16 * 8;
  result.keccak = {
    addressBits: bitBalance(addresses, 160),
    firstHex: { counts: firstHex, test: goodnessOfFit(firstHex, new Array(16).fill(1 / 16)) },
    bytes: { counts: byteCounts, test: goodnessOfFit(byteCounts, new Array(256).fill(1 / 256)) },
    avalanche: {
      ...distanceTest(keccakDistances, 256),
      pairs,
      perOutput: rateTest(perOutput, pairs),
      perInput: rateTest(perInput, SAMPLES.keccakInputs * 256),
      blocks: Array.from({ length: 32 }, (_, r) => Array.from({ length: 32 }, (_, c) => (blocks[32 * r + c] - blockMeasurements / 2) / Math.sqrt(blockMeasurements / 4))),
    },
    versusSha3: distanceTest(versusSha3, 256),
  };

  // --- EIP-55 ---------------------------------------------------------------
  const checksummed = addresses.map((a) => toChecksumAddress(`0x${toHex(a)}`));
  const letterCounts = new Array(41).fill(0);
  let letters = 0;
  let upper = 0;
  for (const c of checksummed) {
    const l = c.chars.filter((x) => x.letter).length;
    letterCounts[l]++;
    letters += l;
    upper += c.chars.filter((x) => x.upper).length;
  }
  // Typos: one character of a checksummed address replaced by a different
  // hexadecimal digit (a letter typed in either case). The typed address
  // passes if every letter has the case EIP-55 asks for the new address: for
  // an ideal hash each letter does with probability 1/2, so the expected
  // number of passes is the sum of 2^-(letters) over the typos.
  let passed = 0;
  let expectedPasses = 0;
  const HEX = '0123456789abcdef';
  const typed = new Uint8Array(40);
  const lower = new Uint8Array(40);
  const typedCodes = checksummed.map((c) => utf8(c.address.slice(2)));
  for (let s = 0; s < SAMPLES.addressTypos; s++) {
    typed.set(typedCodes[s % typedCodes.length]);
    const position = Math.floor(rand() * 40);
    const was = HEX.indexOf(String.fromCharCode(typed[position] | 0x20));
    let next = Math.floor(rand() * 15);
    if (next >= was) next++;
    const upperCase = next >= 10 && rand() < 0.5;
    typed[position] = HEX.charCodeAt(next) - (upperCase ? 0x20 : 0);
    let letters = 0;
    for (let i = 0; i < 40; i++) {
      lower[i] = typed[i] >= 0x41 && typed[i] <= 0x46 ? typed[i] | 0x20 : typed[i];
      if (lower[i] >= 0x61) letters++;
    }
    expectedPasses += 2 ** -letters;
    const hash = keccak256(lower);
    let ok = true;
    for (let i = 0; i < 40 && ok; i++) {
      if (lower[i] < 0x61) continue;
      const nibble = i % 2 === 0 ? hash[i >> 1] >> 4 : hash[i >> 1] & 15;
      ok = (nibble >= 8) === (typed[i] <= 0x46);
    }
    if (ok) passed++;
    if (s % 250 === 0) yield;
  }
  result.eip55 = {
    letters: { counts: letterCounts, test: goodnessOfFit(letterCounts, binomialProbabilities(40, 6 / 16)), mean: letters / checksummed.length },
    uppercase: binomialTest(upper, letters, 0.5),
    typos: { trials: SAMPLES.addressTypos, passed, ...poissonTest(passed, expectedPasses), exactRate: (13 / 16) ** 40 },
  };
  return result;
}

/** The whole exploration in one go: for a worker, the command line and the tests. */
export function explore(options) {
  const steps = exploreSteps(options);
  let step = steps.next();
  while (!step.done) step = steps.next();
  return step.value;
}

/** The exploration in slices of a few milliseconds, with the browser free to draw in between. */
export function exploreAsync(options, { sliceMs = 12, schedule = (run) => setTimeout(run, 0) } = {}) {
  return new Promise((resolve, reject) => {
    let steps;
    try {
      steps = exploreSteps(options);
    } catch (error) {
      reject(error);
      return;
    }
    const run = () => {
      const end = Date.now() + sliceMs;
      try {
        let step = steps.next();
        while (!step.done && Date.now() < end) step = steps.next();
        if (step.done) resolve(step.value);
        else schedule(run);
      } catch (error) {
        reject(error);
      }
    };
    schedule(run);
  });
}

/**
 * Every hypothesis test of the exploration, by step of the pipeline, as
 * [key, test] pairs: the page, the downloadable program and the command
 * line list the same 28 tests in the same order.
 */
export function statisticalTests(s) {
  return {
    bip39: [
      ['words', s.bip39.words.test],
      ['nibble', s.bip39.checksumNibble.test],
      ['random', s.bip39.randomSequences],
      ['typos', s.bip39.wordTypos],
    ],
    seed: [
      ['bits', s.seed.bits.global],
      ['avalancheMean', s.seed.avalanche.mean_test],
      ['avalancheFit', s.seed.avalanche.fit],
    ],
    bip32: [
      ['bits', s.bip32.bits.global],
      ['siblingsMean', s.bip32.siblings.mean_test],
      ['siblingsFit', s.bip32.siblings.fit],
      ['correlation', s.bip32.correlation],
    ],
    secp256k1: [
      ['parity', s.secp256k1.parity],
      ['bitsX', s.secp256k1.bitsX.global],
      ['bitsY', s.secp256k1.bitsY.global],
      ['avalancheMean', s.secp256k1.avalanche.mean_test],
      ['avalancheFit', s.secp256k1.avalanche.fit],
    ],
    keccak: [
      ['bits', s.keccak.addressBits.global],
      ['firstHex', s.keccak.firstHex.test],
      ['bytes', s.keccak.bytes.test],
      ['avalancheMean', s.keccak.avalanche.mean_test],
      ['avalancheFit', s.keccak.avalanche.fit],
      ['sacOutput', s.keccak.avalanche.perOutput.global],
      ['sacInput', s.keccak.avalanche.perInput.global],
      ['sha3Mean', s.keccak.versusSha3.mean_test],
      ['sha3Fit', s.keccak.versusSha3.fit],
    ],
    eip55: [
      ['letters', s.eip55.letters.test],
      ['uppercase', s.eip55.uppercase],
      ['typos', s.eip55.typos],
    ],
  };
}

/** The null hypothesis of every test, in English (the page has them in Italian too). */
export const TEST_LABELS = Object.freeze({
  bip39: {
    words: 'The 2048 words are equally likely (chi-square goodness of fit)',
    nibble: 'The 4 checksum bits are uniform over the 16 values (χ²)',
    random: '12 random words pass the checksum with probability 1/16 (binomial)',
    typos: 'A replaced word passes the checksum with the computed probability (binomial)',
  },
  seed: {
    bits: 'Every bit of the seed is a fair coin: Σz² ~ χ²(512)',
    avalancheMean: 'One changed entropy bit changes 256 seed bits on average (z)',
    avalancheFit: 'The distances follow Binomial(512, 1/2) (χ²)',
  },
  bip32: {
    bits: 'Every bit of the child keys is a fair coin: Σz² ~ χ²(256)',
    siblingsMean: 'Keys of consecutive indices are 128 bits apart on average (z)',
    siblingsFit: 'Their distances follow Binomial(256, 1/2) (χ²)',
    correlation: 'Index bits and key bits are independent (permutations)',
  },
  secp256k1: {
    parity: 'y is odd with probability 1/2 (binomial)',
    bitsX: 'The bits of x are fair coins: Σz² ~ χ²(256)',
    bitsY: 'The bits of y are fair coins: Σz² ~ χ²(256)',
    avalancheMean: 'One changed bit of k changes 256 bits of x ‖ y on average (z)',
    avalancheFit: 'The distances follow Binomial(512, 1/2) (χ²)',
  },
  keccak: {
    bits: 'The bits of the addresses are fair coins: Σz² ~ χ²(160)',
    firstHex: 'The first hexadecimal digit is uniform (χ²)',
    bytes: 'The bytes of the addresses are uniform over the 256 values (χ²)',
    avalancheMean: 'One changed input bit changes 128 output bits on average (z)',
    avalancheFit: 'The distances follow Binomial(256, 1/2) (χ²)',
    sacOutput: 'Every output bit changes with probability 1/2: Σz² ~ χ²(256)',
    sacInput: 'Every input bit changes half of the output on average: Σz² ~ χ²(512)',
    sha3Mean: 'Keccak-256 and SHA3-256 of the same input are 128 bits apart on average (z)',
    sha3Fit: 'Their distances follow Binomial(256, 1/2) (χ²)',
  },
  eip55: {
    letters: 'Letters per address follow Binomial(40, 3/8) (χ²)',
    uppercase: 'Half of the letters are upper case (binomial)',
    typos: 'The accepted typos are those expected for an ideal hash (exact Poisson)',
  },
});

// ---------------------------------------------------------------------------
// 9. Charts (browser, <canvas>)
// ---------------------------------------------------------------------------

export const DEFAULT_PALETTE = {
  background: '#ffffff',
  text: '#444444',
  grid: '#eeeeee',
  bars: '#5c6bc0',
  reference: '#d52349',
  heatNegative: '#3b6fd8',
  heatZero: '#f2f2f2',
  heatPositive: '#d52349',
  heatNull: '#d9d9d9',
};

/**
 * Sizes a canvas for drawing at the device's pixel density. `knownWidth`,
 * when given (for example by a ResizeObserver), avoids reading clientWidth,
 * which right after another canvas has been resized would force the browser
 * to lay out the whole page again.
 */
function setupCanvas(canvas, aspect, knownWidth = 0) {
  const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
  const width = knownWidth > 0 ? knownWidth : canvas.clientWidth || 480;
  const height = Math.round(width * aspect);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width, height };
}

const chartNumber = (text, decimal) => (decimal === '.' ? text : text.replace('.', decimal));
const BAR_ASPECT = 0.42;
const BAR_MARGIN = { left: 34, right: 8, top: 10, bottom: 22 };
const HEATMAP_MARGIN = { left: 34, right: 8, top: 18, bottom: 34 };
const HEATMAP_MIN_CELL = 2;

/**
 * Where the bars of drawBarChart lie on a canvas of this width: the plot
 * area and its pixel columns, each showing perColumn bars (more than one
 * when there are more bars than pixels).
 */
function barLayout(bars, width) {
  const height = Math.round(width * BAR_ASPECT);
  const w = width - BAR_MARGIN.left - BAR_MARGIN.right;
  const h = height - BAR_MARGIN.top - BAR_MARGIN.bottom;
  const columns = Math.min(bars, Math.max(1, Math.floor(w)));
  return { margin: BAR_MARGIN, w, h, height, columns, perColumn: bars / columns, colW: w / columns };
}

/** Where the cells of drawHeatmap lie on a canvas of this width. */
function heatmapLayout(values, width) {
  const rows = values.length;
  const cols = rows ? values[0].length : 0;
  const cell = Math.max(HEATMAP_MIN_CELL, (width - HEATMAP_MARGIN.left - HEATMAP_MARGIN.right) / Math.max(1, cols));
  return { margin: HEATMAP_MARGIN, rows, cols, cell, height: Math.round(HEATMAP_MARGIN.top + HEATMAP_MARGIN.bottom + rows * cell) };
}

/**
 * Bar chart of `values` with an optional dashed reference (`expected`, one
 * value per bar or a single number) and labels under the first, the middle
 * and the last bar. With more bars than pixels each pixel column shows the
 * largest of its bars, so that no value disappears.
 */
export function drawBarChart(canvas, { values, expected = null, labels = null, max = null, decimal = '.', width: knownWidth = 0 }, palette = DEFAULT_PALETTE) {
  const pal = { ...DEFAULT_PALETTE, ...palette };
  const { ctx, width, height } = setupCanvas(canvas, BAR_ASPECT, knownWidth);
  const { margin, w, h, columns, perColumn, colW } = barLayout(values.length, width);
  const refs = expected === null ? [] : Array.isArray(expected) ? expected : values.map(() => expected);
  const top = max ?? Math.max(1e-9, ...values, ...refs) * 1.1;
  ctx.fillStyle = pal.background;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = pal.grid;
  ctx.strokeRect(margin.left, margin.top, w, h);
  const gap = columns === values.length ? colW * 0.12 : 0;
  ctx.fillStyle = pal.bars;
  for (let c = 0; c < columns; c++) {
    const from = Math.floor(c * perColumn);
    const to = Math.max(Math.floor((c + 1) * perColumn), from + 1);
    let v = 0;
    for (let i = from; i < to; i++) v = Math.max(v, values[i] ?? 0);
    const bh = (v / top) * h;
    ctx.fillRect(margin.left + c * colW + gap, margin.top + h - bh, Math.max(0.6, colW - 2 * gap), bh);
  }
  if (refs.length) {
    ctx.strokeStyle = pal.reference;
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let c = 0; c < columns; c++) {
      const y = margin.top + h - ((refs[Math.floor(c * perColumn)] ?? 0) / top) * h;
      ctx.moveTo(margin.left + c * colW, y);
      ctx.lineTo(margin.left + (c + 1) * colW, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.fillStyle = pal.text;
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'right';
  const fmt = (v) => chartNumber(top <= 1.5 ? v.toFixed(2) : String(Math.round(v)), decimal);
  ctx.fillText(fmt(top), margin.left - 4, margin.top + 9);
  ctx.fillText(fmt(0), margin.left - 4, margin.top + h);
  if (labels) {
    ctx.textAlign = 'center';
    const barW = w / values.length;
    for (const i of new Set([0, Math.floor((labels.length - 1) / 2), labels.length - 1])) {
      ctx.fillText(labels[i], margin.left + (i + 0.5) * barW, margin.top + h + 15);
    }
  }
}

const hexToRgb = (hex) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
const mix = (a, b, f) => {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return `rgb(${Math.round(r1 + (r2 - r1) * f)}, ${Math.round(g1 + (g2 - g1) * f)}, ${Math.round(b1 + (b2 - b1) * f)})`;
};

/**
 * Heatmap of a matrix of numbers in [-range, range] around 0 (negative in
 * blue, positive in red, null cells in grey), with a legend.
 */
export function drawHeatmap(canvas, { values, range = 4, rowLabel = '', colLabel = '', decimal = '.', width: knownWidth = 0 }, palette = DEFAULT_PALETTE) {
  const pal = { ...DEFAULT_PALETTE, ...palette };
  const width = knownWidth > 0 ? knownWidth : canvas.clientWidth || 480;
  const { margin, rows, cols, cell } = heatmapLayout(values, width);
  const { ctx, height } = setupCanvas(canvas, (margin.top + margin.bottom + rows * cell) / width, width);
  ctx.fillStyle = pal.background;
  ctx.fillRect(0, 0, width, height);
  const color = (v) => {
    if (v === null || Number.isNaN(v)) return pal.heatNull;
    const f = Math.max(-1, Math.min(1, v / range));
    return f < 0 ? mix(pal.heatZero, pal.heatNegative, -f) : mix(pal.heatZero, pal.heatPositive, f);
  };
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      ctx.fillStyle = color(values[i][j]);
      ctx.fillRect(margin.left + j * cell, margin.top + i * cell, Math.max(1, cell - (cell > 4 ? 1 : 0)), Math.max(1, cell - (cell > 4 ? 1 : 0)));
    }
  }
  ctx.fillStyle = pal.text;
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(colLabel, margin.left + (cols * cell) / 2, margin.top - 6);
  ctx.save();
  ctx.translate(10, margin.top + (rows * cell) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(rowLabel, 0, 0);
  ctx.restore();
  const ly = margin.top + rows * cell + 12;
  const lw = Math.min(200, width - margin.left - margin.right);
  for (let s = 0; s < lw; s++) {
    ctx.fillStyle = color(((s / (lw - 1)) * 2 - 1) * range);
    ctx.fillRect(margin.left + s, ly, 1, 8);
  }
  ctx.fillStyle = pal.text;
  ctx.textAlign = 'left';
  ctx.fillText(`-${chartNumber(String(range), decimal)}`, margin.left, ly + 19);
  ctx.textAlign = 'center';
  ctx.fillText('0', margin.left + lw / 2, ly + 19);
  ctx.textAlign = 'right';
  ctx.fillText(`+${chartNumber(String(range), decimal)}`, margin.left + lw, ly + 19);
}

/** The height that drawBarChart or drawHeatmap gives a canvas of this width, to reserve the space before drawing. */
export function chartHeight(draw, data, width) {
  return draw === drawHeatmap ? heatmapLayout(data.values, width).height : barLayout(data.values.length, width).height;
}

/**
 * The bar or the cell under the point (x, y) of a chart drawn at this
 * width, in CSS pixels from its top left corner; null outside the plot.
 * For bars, the values [from, to) of the pixel column (more than one when
 * there are more bars than pixels); for heatmaps, row and column. `rect` is
 * the rectangle to outline.
 */
export function chartHitTest(draw, data, width, x, y) {
  if (draw === drawHeatmap) {
    const { margin, rows, cols, cell } = heatmapLayout(data.values, width);
    const col = Math.floor((x - margin.left) / cell);
    const row = Math.floor((y - margin.top) / cell);
    if (row < 0 || row >= rows || col < 0 || col >= cols) return null;
    return { kind: 'cell', row, col, rect: { x: margin.left + col * cell, y: margin.top + row * cell, width: cell, height: cell } };
  }
  const { margin, w, h, columns, perColumn, colW } = barLayout(data.values.length, width);
  if (x < margin.left || x >= margin.left + w || y < margin.top || y > margin.top + h) return null;
  const column = Math.min(columns - 1, Math.floor((x - margin.left) / colW));
  const from = Math.floor(column * perColumn);
  const to = Math.max(Math.floor((column + 1) * perColumn), from + 1);
  return { kind: 'bar', from, to, rect: { x: margin.left + column * colW, y: margin.top, width: colW, height: h } };
}

/**
 * Explains a chart under the pointer: the bar or the cell below the mouse,
 * or below the finger after a tap, gets an outline and a label with the
 * text describe(hit), inserted as plain text. Both stay inside the
 * canvas's parent, which must be positioned. Returns the function that
 * removes them.
 */
export function attachChartTooltip(canvas, { draw, data, describe }) {
  const box = canvas.parentElement;
  const mark = document.createElement('div');
  const tip = document.createElement('div');
  mark.className = 'chart-mark';
  tip.className = 'chart-tip';
  // the canvas already has its description; the label only repeats numbers on screen
  mark.setAttribute('aria-hidden', 'true');
  tip.setAttribute('aria-hidden', 'true');
  mark.hidden = true;
  tip.hidden = true;
  box.append(mark, tip);
  canvas.classList.add('has-tip');
  let frame = 0;
  let shown = null;
  const hide = () => {
    mark.hidden = true;
    tip.hidden = true;
    shown = null;
  };
  const show = (clientX, clientY) => {
    const r = canvas.getBoundingClientRect();
    const x = clientX - r.left;
    const y = clientY - r.top;
    const hit = chartHitTest(draw, data, r.width, x, y);
    const text = hit && describe(hit);
    if (!text) {
      hide();
      return;
    }
    const left = canvas.offsetLeft;
    const top = canvas.offsetTop;
    Object.assign(mark.style, {
      left: `${left + hit.rect.x}px`,
      top: `${top + hit.rect.y}px`,
      width: `${Math.max(2, hit.rect.width)}px`,
      height: `${hit.rect.height}px`,
    });
    mark.classList.toggle('is-thin', hit.rect.width < 6);
    mark.hidden = false;
    if (text !== shown) {
      tip.textContent = text;
      shown = text;
    }
    tip.hidden = false;
    // above and to the right of the pointer, flipped near the edges of the figure
    let tx = left + x + 14;
    if (tx + tip.offsetWidth > box.clientWidth) tx = Math.max(0, left + x - tip.offsetWidth - 14);
    let ty = top + y - tip.offsetHeight - 12;
    if (ty < 0) ty = top + y + 18;
    tip.style.left = `${tx}px`;
    tip.style.top = `${ty}px`;
  };
  const onMove = (e) => {
    if (e.pointerType === 'touch') return;
    const { clientX, clientY } = e;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => show(clientX, clientY));
  };
  // a finger leaves the canvas as soon as it is lifted: the label stays until a tap elsewhere
  const onLeave = (e) => {
    if (e.pointerType !== 'touch') hide();
  };
  const onDown = (e) => {
    if (e.pointerType === 'touch') show(e.clientX, e.clientY);
  };
  const onDocumentDown = (e) => {
    if (e.target !== canvas) hide();
  };
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerleave', onLeave);
  canvas.addEventListener('pointerdown', onDown);
  document.addEventListener('pointerdown', onDocumentDown);
  return () => {
    cancelAnimationFrame(frame);
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerleave', onLeave);
    canvas.removeEventListener('pointerdown', onDown);
    document.removeEventListener('pointerdown', onDocumentDown);
    canvas.classList.remove('has-tip');
    mark.remove();
    tip.remove();
  };
}

// ---------------------------------------------------------------------------
// 10. Printed report and command line
// ---------------------------------------------------------------------------

const short = (hex, keep = 16) => (hex.length > 2 * keep + 3 ? `${hex.slice(0, keep)}...${hex.slice(-keep)}` : hex);

/** The pipeline as the program prints it, step by step. */
export function reportLines(pipeline) {
  const lines = [];
  const a = pipeline.analysis;
  lines.push(`Mnemonic (${a.count} words): ${a.sentence}`);
  if (!pipeline.ok) {
    if (pipeline.stage === 'path') lines.push(`Invalid derivation path: ${pipeline.error}`);
    else if (a.error === 'unknown-word') lines.push(`Not a BIP-39 sentence: ${a.unknown.map((u) => `"${u.word}" (word ${u.position})`).join(', ')} not in the list`);
    else if (a.error === 'length') lines.push(`Not a BIP-39 sentence: ${a.count} words, it must have ${MNEMONIC_LENGTHS.join(', ')}`);
    else if (a.error === 'checksum') lines.push(`Not a valid BIP-39 sentence: checksum ${a.checksum}, expected ${a.expectedChecksum}`);
    else lines.push('No words.');
    return lines;
  }
  lines.push(`  word indices (11 bits each): ${a.indices.join(' ')}`);
  lines.push(`  entropy (${a.entropy.length * 8} bits): ${toHex(a.entropy)}`);
  lines.push(`  checksum (${a.checksum.length} bits): ${a.checksum} = first bits of SHA-256(entropy)`);
  lines.push('');
  lines.push(`BIP-39 seed = PBKDF2-HMAC-SHA512(sentence, "mnemonic${pipeline.passphrase ? '...' : ''}", 2048 iterations):`);
  lines.push(`  ${toHex(pipeline.seed)}`);
  lines.push('BIP-32 master key = HMAC-SHA512("Bitcoin seed", seed):');
  lines.push(`  private key ${short(toHex(ser256(pipeline.master.node.privateKey)))}, chain code ${short(toHex(pipeline.master.node.chainCode))}`);
  lines.push(`BIP-44 path ${pipeline.path}:`);
  for (const step of pipeline.steps) {
    lines.push(`  ${step.label.padEnd(5)} ${step.hardened ? 'hardened' : 'normal  '}  k = ${short(toHex(ser256(step.node.privateKey)))}`);
  }
  lines.push(`  extended public key of the parent: ${pipeline.extended.parentXpub}`);
  lines.push('');
  lines.push(`Private key:              0x${toHex(pipeline.privateKey)}`);
  lines.push(`Public key (secp256k1):   ${toHex(pipeline.publicKey.uncompressed)}`);
  lines.push(`  compressed:             ${toHex(pipeline.publicKey.compressed)}`);
  lines.push(`Keccak-256(x || y):       ${toHex(pipeline.address.hash)}`);
  lines.push(`Address (last 20 bytes):  ${pipeline.address.address}`);
  lines.push(`EIP-55 checksummed:       ${pipeline.checksum.address}`);
  return lines;
}

const DIGITS = /^\d{1,10}$/;

/** The steps of the pipeline as the command line names them. */
const STEP_NAMES = { bip39: 'BIP-39', seed: 'PBKDF2', bip32: 'BIP-32', secp256k1: 'secp256k1', keccak: 'Keccak-256', eip55: 'EIP-55' };

/**
 * Command line: node homework2.js [--mnemonic "w1 ... w12"] [--passphrase p]
 * [--index i | --path m/...] [--random 12|24] [--no-stats]. Options are
 * checked strictly: anything unknown or malformed prints the usage.
 */
export function runCli(argv, print = console.log) {
  const usage = () => {
    print('usage: node homework2.js [--mnemonic "w1 ... w12"] [--passphrase text] [--index i | --path m/44\'/60\'/0\'/0/0] [--random 12|15|18|21|24] [--no-stats]');
    print('       Educational code: never type a real seed phrase, here or anywhere else.');
    return 1;
  };
  const options = { mnemonic: DEFAULT_MNEMONIC, passphrase: '', path: DEFAULT_PATH, stats: true };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const value = argv[i + 1];
    if (arg === '--no-stats') options.stats = false;
    else if (arg === '--mnemonic' && value !== undefined) {
      options.mnemonic = value;
      i++;
    } else if (arg === '--passphrase' && value !== undefined) {
      options.passphrase = value;
      i++;
    } else if (arg === '--index' && value !== undefined && DIGITS.test(value) && Number(value) < HARDENED) {
      options.path = pathFor('bip44', Number(value));
      i++;
    } else if (arg === '--path' && value !== undefined) {
      try {
        parsePath(value);
      } catch {
        return usage();
      }
      options.path = value;
      i++;
    } else if (arg === '--random' && value !== undefined && MNEMONIC_LENGTHS.includes(Number(value)) && DIGITS.test(value)) {
      options.mnemonic = generateMnemonic(Number(value));
      i++;
    } else {
      return usage();
    }
  }
  const pipeline = walletPipeline(options);
  reportLines(pipeline).forEach((l) => print(l));
  print('');
  const rows = verifyVectors();
  const failed = rows.filter((r) => !r.ok);
  print(`Official test vectors: ${rows.length - failed.length} of ${rows.length} reproduced exactly.`);
  failed.forEach((r) => print(`  FAILED ${r.group} ${r.name}: expected ${r.expected}, got ${r.actual}`));
  if (!options.stats) return pipeline.ok && !failed.length ? 0 : 1;
  print('');
  const s = explore();
  const all = Object.entries(statisticalTests(s)).flatMap(([step, list]) => list.map(([key, test]) => ({ step, key, test })));
  const p = (t) => (t.pValue < 0.001 ? t.pValue.toExponential(1) : t.pValue.toFixed(3));
  print(`Statistical properties: ${all.length} hypothesis tests on random inputs from a fixed seed (${EXPLORE_SEED}), alpha = ${SIGNIFICANCE}.`);
  print('  step        p-value  null hypothesis H0');
  for (const { step, key, test } of all) {
    print(`  ${STEP_NAMES[step].padEnd(11)} ${p(test).padEnd(7)}  ${test.verdict === 'reject' ? '[rejected] ' : ''}${TEST_LABELS[step][key]}`);
  }
  const h = s.secp256k1.homomorphism;
  print(`  secp256k1   structure, not a test: (k1 + k2)G = k1G + k2G in ${h.holds} of ${h.trials} trials`);
  const rejected = all.filter((t) => t.test.verdict === 'reject').length;
  const smallest = all.reduce((m, t) => (t.test.pValue < m.test.pValue ? t : m));
  print(`Rejected: ${rejected} of ${all.length} (${(all.length * SIGNIFICANCE).toFixed(1)} expected by chance if every function were ideal).`);
  print(`Smallest p-value: ${p(smallest.test)} (${STEP_NAMES[smallest.step]}); the Bonferroni threshold would be ${SIGNIFICANCE}/${all.length} = ${(SIGNIFICANCE / all.length).toFixed(4)}.`);
  return pipeline.ok && !failed.length ? 0 : 1;
}

/** True under Node, where the downloadable program can run runCli. */
export const isNode = typeof process !== 'undefined' && !!(process.versions && process.versions.node);

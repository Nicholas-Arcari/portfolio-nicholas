/* global process */
/**
 * Homework #2 - A toy elliptic-curve scheme and the Caesar cipher:
 *               encryption, statistical cryptanalysis and attacks
 * Sapienza University of Rome - MSc in Cybersecurity (LM-66) - Statistics
 * Nicholas Arcari
 *
 * The same message through two ciphers, and an attack on each: the
 * statistical attack that breaks the Caesar cipher by the letter frequencies
 * of a known language, and the algebraic attack that breaks the toy
 * elliptic-curve scheme because its private keys have only 32 bits.
 * Everything is written from scratch, with no dependencies:
 *
 *   0. Input validation and bytes
 *   1. SHA-256 (the nonces of the reproducible ciphertexts)
 *   2. secp256k1
 *   3. The toy scheme: EC-ElGamal on secp256k1 with 32-bit private keys
 *   4. The Caesar cipher
 *   5. The corpus and its language models
 *   6. Statistical cryptanalysis of the Caesar cipher
 *   7. Attacks on the toy scheme
 *   8. Statistics: hypothesis tests and experiments
 *   9. Charts (browser, <canvas>)
 *  10. Printed report and command line
 *
 * Educational code: the scheme is weak on purpose (32-bit private keys, no
 * authentication) and the arithmetic is not constant-time. Never use it to
 * protect anything.
 */
import { CHAPTERS, CORPUS_SHA256 } from './corpus.js';

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

/** A string from its UTF-8 bytes, or null if the bytes are not valid UTF-8. */
export function utf8Decode(bytes) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

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

/** Bytes from the cryptographic generator of the browser (or of Node). */
export function secureRandomBytes(length) {
  const out = new Uint8Array(length);
  const webCrypto = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (webCrypto && typeof webCrypto.getRandomValues === 'function') return webCrypto.getRandomValues(out);
  // eslint-disable-next-line no-undef
  if (typeof require === 'function') return require('crypto').randomFillSync(out);
  return fail('no cryptographic random generator available');
}

/** Milliseconds from an arbitrary origin, as precise as the platform allows. */
const now = () => (typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now());

// ---------------------------------------------------------------------------
// 1. SHA-256 (FIPS 180-4)
// ---------------------------------------------------------------------------

// The first 32 bits of the fractional parts of the cube roots of the first
// 64 primes, and of the square roots of the first 8: checked at the end of
// this file against the standard's test vector.
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

/** Merkle-Damgard padding: the message, a 1 bit, zeros, and the length in bits in the last 8 bytes, up to a multiple of 64 bytes. */
function mdPad(message) {
  const padded = new Uint8Array(Math.ceil((message.length + 9) / 64) * 64);
  padded.set(message);
  padded[message.length] = 0x80;
  let bits = message.length * 8;
  for (let i = padded.length - 1; i >= padded.length - 7; i--) {
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

/** SHA-256 (FIPS 180-4): 32 bytes. Here it draws the nonces of the reproducible ciphertexts and checks the corpus. */
export function sha256(message) {
  assertBytes('message', message);
  const H = Int32Array.from(H256);
  const padded = mdPad(message);
  for (let o = 0; o < padded.length; o += 64) sha256Compress(H, padded, o);
  const out = new Uint8Array(32);
  for (let i = 0; i < 8; i++) out.set(ser32(H[i]), 4 * i);
  return out;
}

// ---------------------------------------------------------------------------
// 2. secp256k1
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

/** The base point G, in affine coordinates. */
export const G = Object.freeze({ x: SECP256K1.Gx, y: SECP256K1.Gy });

const MASK256 = (1n << 256n) - 1n;
// 2^256 = 2^32 + 977 (mod p): the high half of a product folds onto the low half
const FOLD = (1n << 32n) + 977n;

const modP = (a) => {
  const r = a % FP;
  return r >= 0n ? r : r + FP;
};

/**
 * x mod p for 0 <= x < 2^520 (the product of two field elements, or a small
 * multiple of it): two folds of the high half, using 2^256 = 2^32 + 977
 * (mod p), leave less than 2p, and one subtraction finishes. Cheaper than a
 * division, and these products are most of the work of every attack.
 */
function reduce(x) {
  let r = (x & MASK256) + (x >> 256n) * FOLD;
  r = (r & MASK256) + (r >> 256n) * FOLD;
  return r >= FP ? r - FP : r;
}

// Field operations on reduced elements, 0 <= a, b < p: no negative values,
// which would break the bit masks of reduce.
const fmul = (a, b) => reduce(a * b);
const fsub = (a, b) => (a >= b ? a - b : a - b + FP);
const fadd = (a, b) => {
  const s = a + b;
  return s >= FP ? s - FP : s;
};

/** Inverse modulo m with the extended Euclidean algorithm. */
function invMod(a, m) {
  let r0 = ((a % m) + m) % m;
  let r1 = m;
  let s0 = 1n;
  let s1 = 0n;
  while (r1 !== 0n) {
    const q = r0 / r1;
    let t = r0 - q * r1;
    r0 = r1;
    r1 = t;
    t = s0 - q * s1;
    s0 = s1;
    s1 = t;
  }
  if (r0 !== 1n) fail('not invertible');
  return s0 < 0n ? s0 + m : s0;
}

// Affine points are objects { x, y } (null is the point at infinity O);
// inside the arithmetic they are in Jacobian coordinates [X, Y, Z], meaning
// (X/Z^2, Y/Z^3): no inversion at every step. Z = 0 is the point at infinity.
const INFINITY_J = Object.freeze([0n, 1n, 0n]);

function jDouble(P) {
  const [X, Y, Z] = P;
  if (Z === 0n || Y === 0n) return INFINITY_J;
  const YY = fmul(Y, Y);
  const S = reduce(4n * fmul(X, YY));
  const M = reduce(3n * fmul(X, X)); // a = 0
  const X3 = fsub(fmul(M, M), fadd(S, S));
  return [X3, fsub(fmul(M, fsub(S, X3)), reduce(8n * fmul(YY, YY))), reduce(2n * fmul(Y, Z))];
}

/** P (Jacobian) + Q (affine, { x, y }; null adds nothing). */
function jAddAffine(P, Q) {
  if (Q === null) return P;
  const [X1, Y1, Z1] = P;
  if (Z1 === 0n) return [Q.x, Q.y, 1n];
  const Z1Z1 = fmul(Z1, Z1);
  const U2 = fmul(Q.x, Z1Z1);
  const S2 = fmul(Q.y, fmul(Z1, Z1Z1));
  const H = fsub(U2, X1);
  const r = fsub(S2, Y1);
  if (H === 0n) return r === 0n ? jDouble(P) : INFINITY_J;
  const HH = fmul(H, H);
  const HHH = fmul(H, HH);
  const V = fmul(X1, HH);
  const X3 = fsub(fsub(fmul(r, r), HHH), fadd(V, V));
  return [X3, fsub(fmul(r, fsub(V, X3)), fmul(Y1, HHH)), fmul(Z1, H)];
}

function toAffine([X, Y, Z]) {
  if (Z === 0n) return null;
  const zi = invMod(Z, FP);
  const zi2 = fmul(zi, zi);
  return { x: fmul(X, zi2), y: fmul(Y, fmul(zi2, zi)) };
}

/** Inverts many nonzero field elements with one inversion (Montgomery's trick). */
function batchInvert(values) {
  const prefix = new Array(values.length);
  let acc = 1n;
  for (let i = 0; i < values.length; i++) {
    prefix[i] = acc;
    acc = fmul(acc, values[i]);
  }
  let inv = invMod(acc, FP);
  const out = new Array(values.length);
  for (let i = values.length - 1; i >= 0; i--) {
    out[i] = fmul(inv, prefix[i]);
    inv = fmul(inv, values[i]);
  }
  return out;
}

/** Many Jacobian points in affine form with one inversion; the point at infinity becomes null. */
function toAffineAll(points) {
  const finite = [];
  for (let i = 0; i < points.length; i++) if (points[i][2] !== 0n) finite.push(i);
  const inverses = batchInvert(finite.map((i) => points[i][2]));
  const out = new Array(points.length).fill(null);
  finite.forEach((i, j) => {
    const zi2 = fmul(inverses[j], inverses[j]);
    out[i] = { x: fmul(points[i][0], zi2), y: fmul(points[i][1], fmul(zi2, inverses[j])) };
  });
  return out;
}

/** P, 2P, ..., count * P (count >= 1), by successive additions, in affine form. */
function successiveMultiples(P, count) {
  const jacobian = new Array(count);
  let acc = INFINITY_J;
  for (let i = 0; i < count; i++) {
    acc = jAddAffine(acc, P);
    jacobian[i] = acc;
  }
  return toAffineAll(jacobian);
}

/**
 * Fixed-base table: d * 16^w * P for every window w (64 of 4 bits) and
 * digit d = 1..15, in affine form. Built once for a point, it turns kP into
 * at most 64 additions instead of about 256 doublings and 128 additions.
 */
function fixedBaseTable(P) {
  const jacobian = [];
  let base = P;
  for (let w = 0; w < 64; w++) {
    let acc = [base.x, base.y, 1n];
    jacobian.push(acc);
    for (let d = 2; d <= 15; d++) {
      acc = jAddAffine(acc, base);
      jacobian.push(acc);
    }
    base = toAffine(jDouble(jDouble(jDouble(jDouble([base.x, base.y, 1n])))));
  }
  return toAffineAll(jacobian);
}

/** kP from the fixed-base table of P, for 1 <= k < n. */
function multiplyByTable(table, k) {
  let R = INFINITY_J;
  for (let w = 0; w < 64; w++) {
    const d = Number((k >> BigInt(4 * w)) & 15n);
    if (d) R = jAddAffine(R, table[15 * w + d - 1]);
  }
  return toAffine(R);
}

let gTable = null;
const generatorTable = () => gTable || (gTable = fixedBaseTable(G));

/** kG for a scalar k in [1, n - 1], as an affine point { x, y }. */
export function multiplyG(k) {
  if (typeof k !== 'bigint' || k <= 0n || k >= CURVE_N) fail('the scalar must be a BigInt in [1, n - 1]');
  return multiplyByTable(generatorTable(), k);
}

/** kP for an affine point P and a scalar k >= 0, by double-and-add from the most significant bit (null is O). */
export function multiply(P, k) {
  if (typeof k !== 'bigint' || k < 0n) fail('the scalar must be a non-negative BigInt');
  if (P === null || k === 0n) return null;
  let R = INFINITY_J;
  for (let i = BigInt(k.toString(2).length - 1); i >= 0n; i--) {
    R = jDouble(R);
    if ((k >> i) & 1n) R = jAddAffine(R, P);
  }
  return toAffine(R);
}

/** P + Q for affine points (null is the point at infinity). */
export function addPoints(P, Q) {
  if (P === null) return Q;
  if (Q === null) return P;
  return toAffine(jAddAffine([P.x, P.y, 1n], Q));
}

/** -P: the point with the same x and the opposite y. */
export const negate = (P) => (P === null ? null : { x: P.x, y: P.y === 0n ? 0n : FP - P.y });

/** P - Q. */
export const subtractPoints = (P, Q) => addPoints(P, negate(Q));

export const pointsEqual = (P, Q) => (P === null || Q === null ? P === Q : P.x === Q.x && P.y === Q.y);

/** Whether an affine point lies on y^2 = x^3 + 7 with coordinates in [0, p). */
export const isOnSecp256k1 = (P) => P !== null && P.x >= 0n && P.x < FP && P.y >= 0n && P.y < FP && modP(P.y * P.y - P.x * P.x * P.x - 7n) === 0n;

/** SEC 1 compressed encoding: 02/03 (the parity of y) || x, 33 bytes; the point at infinity is the single byte 00. */
export const encodeCompressed = (P) => (P === null ? new Uint8Array(1) : concat([P.y % 2n === 0n ? 2 : 3], ser256(P.x)));

/** The point of a compressed encoding: y = (x^3 + 7)^((p + 1) / 4), since p = 3 (mod 4). Refuses anything that is not a curve point. */
export function decodeCompressed(bytes) {
  assertBytes('compressed point', bytes, 33);
  if (bytes[0] !== 2 && bytes[0] !== 3) fail('a compressed point starts with 02 or 03');
  const x = bytesToBigInt(bytes.slice(1));
  if (x >= FP) fail('x is not a field element');
  const y2 = modP(x * x * x + 7n);
  let y = 1n;
  let base = y2;
  let e = (FP + 1n) / 4n;
  while (e > 0n) {
    if (e & 1n) y = fmul(y, base);
    base = fmul(base, base);
    e >>= 1n;
  }
  if (fmul(y, y) !== y2) fail('x is not the abscissa of a curve point');
  if (Number(y & 1n) !== bytes[0] - 2) y = FP - y;
  return { x, y };
}

/** A point as 66 hexadecimal digits (compressed form). */
export const pointHex = (P) => toHex(encodeCompressed(P));

/** The low 52 bits of x as a Number: the key of the hash tables of the attacks (a match is then checked in full). */
const xKey = (x) => Number(x & 0xfffffffffffffn);

/**
 * P_i + Q_i for many pairs of affine points at once, in place on the arrays
 * of coordinates xs, ys: one inversion for all the slopes (Montgomery's
 * trick), so each addition costs about six multiplications instead of an
 * inversion. The point at infinity has x = null. A pair with the same x
 * (P = Q or P = -Q), or with P at infinity, which the attacks meet at most
 * once, goes through the general formulas.
 */
function addInPlace(xs, ys, qx, qy) {
  const count = xs.length;
  const dens = new Array(count);
  const special = new Uint8Array(count);
  for (let i = 0; i < count; i++) {
    const d = xs[i] === null ? 0n : fsub(qx[i], xs[i]);
    if (d === 0n) {
      special[i] = 1;
      dens[i] = 1n;
    } else dens[i] = d;
  }
  const inverses = batchInvert(dens);
  for (let i = 0; i < count; i++) {
    if (special[i]) {
      const R = addPoints(xs[i] === null ? null : { x: xs[i], y: ys[i] }, { x: qx[i], y: qy[i] });
      xs[i] = R === null ? null : R.x;
      ys[i] = R === null ? null : R.y;
      continue;
    }
    const l = fmul(fsub(qy[i], ys[i]), inverses[i]);
    const x3 = fsub(fsub(fmul(l, l), xs[i]), qx[i]);
    ys[i] = fsub(fmul(l, fsub(xs[i], x3)), ys[i]);
    xs[i] = x3;
  }
}

// ---------------------------------------------------------------------------
// 3. The toy scheme: EC-ElGamal on secp256k1 with 32-bit private keys
// ---------------------------------------------------------------------------

/** The restriction of the toy scheme: private keys of at most 32 bits, 1 <= k <= 2^32 - 1. */
export const KEY_BITS = 32;
export const KEY_MAX = 2n ** BigInt(KEY_BITS) - 1n;

/** The private key of the page, drawn once for this homework with a cryptographic generator. */
export const DEFAULT_KEY = 3474662160n;

/** The message of the page: Suetonius on Caesar's cipher (Life of Julius Caesar, 56.6, in J. C. Rolfe's translation, 1914). */
export const DEFAULT_MESSAGE = 'If anyone wishes to decipher these, and get at their meaning, he must substitute the fourth letter of the alphabet, namely D, for A, and so with the others.';

/** Longest message accepted, in UTF-8 bytes: every byte becomes a ciphertext block of 66 bytes. */
export const MESSAGE_MAX_BYTES = 280;

/** The seed of the reproducible nonces (seededNonce). */
export const NONCE_SEED = 'Homework #2 - toy EC-ElGamal nonces';

/** The private key typed by the user: decimal digits only, from 1 to KEY_MAX. */
export function parsePrivateKey(text) {
  const t = String(text).trim();
  if (t === '') return { ok: false, error: 'empty' };
  if (!/^\d+$/.test(t)) return { ok: false, error: 'notInteger', text: t };
  if (t.replace(/^0+/, '').length > 10) return { ok: false, error: 'range' };
  const k = BigInt(t);
  if (k < 1n || k > KEY_MAX) return { ok: false, error: 'range' };
  return { ok: true, value: k };
}

/** A uniformly random private key of the toy scheme, from the cryptographic generator. */
export function randomPrivateKey() {
  for (;;) {
    const k = bytesToBigInt(secureRandomBytes(KEY_BITS / 8));
    if (k >= 1n && k <= KEY_MAX) return k;
  }
}

let byteTable = null;

/** The 256 points bG that encode the bytes b = 0..255 (0G is the point at infinity), and the way back from x to b. */
function bytePoints() {
  if (!byteTable) {
    const points = [null, ...successiveMultiples(G, 255)];
    byteTable = { points, index: new Map(points.slice(1).map((P, i) => [P.x, i + 1])) };
  }
  return byteTable;
}

/** The point that encodes a byte: M = bG. */
export const encodeByte = (b) => bytePoints().points[b];

/**
 * The byte encoded by a point, or -1 if the point is not bG for a byte b:
 * a discrete logarithm, easy because b has only 256 possible values (a
 * table of the 256 points, built once).
 */
export function decodeByte(M) {
  if (M === null) return 0;
  const { points, index } = bytePoints();
  const b = index.get(M.x);
  return b !== undefined && points[b].y === M.y ? b : -1;
}

/**
 * The nonce r_i of block i in the reproducible ciphertexts: the first value
 * of SHA-256(seed || i || attempt) in [1, n - 1], for attempt = 0, 1, ...
 * Deterministic, so that the page, the downloadable program and the command
 * line show the same ciphertext; for the same reason anyone can recompute
 * it, which a real sender must never allow (section 4.8): there r comes
 * from a cryptographic generator, as in randomNonce.
 */
export function seededNonce(i, seed = NONCE_SEED) {
  const prefix = utf8(seed);
  for (let attempt = 0; ; attempt++) {
    const r = bytesToBigInt(sha256(concat(prefix, ser32(i), ser32(attempt))));
    if (r >= 1n && r < CURVE_N) return r;
  }
}

/** A nonce from the cryptographic generator, uniform in [1, n - 1]. */
export function randomNonce() {
  for (;;) {
    const r = bytesToBigInt(secureRandomBytes(32));
    if (r >= 1n && r < CURVE_N) return r;
  }
}

/**
 * The toy scheme with one key pair. Key generation: a private key k of at
 * most 32 bits and the public key K = kG. Encryption with K, byte by byte:
 * M_i = b_i G, a fresh nonce r_i, C1 = r_i G, S_i = r_i K, C2 = M_i + S_i.
 * Decryption with k: S_i = k C1 (= k r_i G = r_i K), M_i = C2 - S_i, and
 * b_i from M_i with the table of the 256 points.
 *
 * What depends only on the key and on the position of a byte (r_i, C1 and
 * S_i, then k C1 when decrypting) is computed once and kept: a new message
 * costs one point addition per byte. `nonces` is 'seeded' (reproducible,
 * seededNonce), 'random' (randomNonce) or a function i -> r_i, for the
 * flawed variants of section 4.8.
 */
export function toyScheme(k, { nonces = 'seeded' } = {}) {
  if (typeof k !== 'bigint' || k < 1n || k > KEY_MAX) fail(`the private key must be a BigInt in [1, ${KEY_MAX}]`);
  const K = multiplyG(k);
  let kTable = null;
  let nonceOf;
  if (typeof nonces === 'function') nonceOf = nonces;
  else if (nonces === 'random') nonceOf = () => randomNonce();
  else nonceOf = (i) => seededNonce(i);
  const secrets = [];
  const byNonce = new Map();
  const shared = new Map();
  const secretAt = (i) => {
    if (!secrets[i]) {
      const r = nonceOf(i);
      if (!byNonce.has(r)) {
        if (!kTable) kTable = fixedBaseTable(K);
        byNonce.set(r, { r, C1: multiplyG(r), S: multiplyByTable(kTable, r) });
      }
      secrets[i] = byNonce.get(r);
    }
    return secrets[i];
  };
  /** The blocks of a message: for every byte, its point M, the nonce r, the shared point S and the ciphertext (C1, C2). */
  function* encryptSteps(text) {
    const bytes = utf8(text);
    const blocks = [];
    for (let i = 0; i < bytes.length; i++) {
      const { r, C1, S } = secretAt(i);
      const M = encodeByte(bytes[i]);
      blocks.push({ index: i, byte: bytes[i], M, r, C1, S, C2: addPoints(M, S) });
      if (i % 25 === 24) yield;
    }
    return { text, bytes, blocks };
  }
  const encrypt = (text) => runSteps(encryptSteps(text));
  /** Decryption of blocks { C1, C2 } with k: S = k C1, M = C2 - S, and the byte of M (-1 if M encodes no byte). */
  function decrypt(blocks) {
    const out = blocks.map(({ C1, C2 }) => {
      const id = C1 === null ? -1n : C1.x * 2n + (C1.y & 1n);
      let S = shared.get(id);
      if (S === undefined) {
        S = multiply(C1, k);
        shared.set(id, S);
      }
      const M = subtractPoints(C2, S);
      return { S, M, byte: decodeByte(M) };
    });
    const ok = out.every((b) => b.byte >= 0);
    const bytes = Uint8Array.from(out, (b) => Math.max(0, b.byte));
    return { blocks: out, ok, bytes, text: ok ? utf8Decode(bytes) : null };
  }
  return { k, K, encrypt, encryptSteps, decrypt };
}

/** The ciphertext as bytes: C1 || C2 for every block, in compressed form, 66 bytes per byte of message. */
export const ciphertextBytes = (blocks) => concat(...blocks.flatMap((b) => [encodeCompressed(b.C1), encodeCompressed(b.C2)]));

// ---------------------------------------------------------------------------
// 4. The Caesar cipher
// ---------------------------------------------------------------------------

export const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

/** The shift of Caesar himself, according to Suetonius: D for A. */
export const DEFAULT_SHIFT = 3;

const isUpper = (c) => c >= 65 && c <= 90;
const isLower = (c) => c >= 97 && c <= 122;

/**
 * The Caesar cipher: every letter a-z and A-Z moves `shift` places forward
 * in the alphabet, from z back to a, keeping its case; anything else
 * (spaces, punctuation, digits, accented letters) stays as it is.
 */
export function caesar(text, shift) {
  const s = ((shift % 26) + 26) % 26;
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (isUpper(c)) out += String.fromCharCode(65 + ((c - 65 + s) % 26));
    else if (isLower(c)) out += String.fromCharCode(97 + ((c - 97 + s) % 26));
    else out += text[i];
  }
  return out;
}

/** Decryption: the same cipher with the opposite shift. */
export const caesarDecrypt = (text, shift) => caesar(text, -shift);

/** The shift typed by the user: an integer from 0 to 25. */
export function parseShift(text) {
  const t = String(text).trim();
  if (t === '') return { ok: false, error: 'empty' };
  if (!/^\d+$/.test(t)) return { ok: false, error: 'notInteger', text: t };
  const s = Number(t);
  if (s > 25) return { ok: false, error: 'range' };
  return { ok: true, value: s };
}

/** The letters a-z of a text, case ignored, as numbers 0-25 (a = 0); everything else is skipped. */
export function letterIndices(text) {
  const out = [];
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (isUpper(c)) out.push(c - 65);
    else if (isLower(c)) out.push(c - 97);
  }
  return Uint8Array.from(out);
}

/** How many times each of the 26 letters occurs. */
export function letterCounts(letters) {
  const counts = new Array(26).fill(0);
  for (const x of letters) counts[x]++;
  return counts;
}

/** The words of a text, as maximal runs of letters a-z (case ignored), each an array of numbers 0-25. */
export function wordsOf(text) {
  const words = [];
  let word = [];
  for (let i = 0; i <= text.length; i++) {
    const c = i < text.length ? text.charCodeAt(i) : 0;
    if (isUpper(c) || isLower(c)) word.push((c | 32) - 97);
    else if (word.length) {
      words.push(Uint8Array.from(word));
      word = [];
    }
  }
  return words;
}

const wordString = (word, shift = 0) => {
  let s = '';
  for (const x of word) s += ALPHABET[(x - shift + 26) % 26];
  return s;
};

// ---------------------------------------------------------------------------
// 5. The corpus and its language models
// ---------------------------------------------------------------------------

/**
 * The chapters of the corpus by role: `training` estimates the language
 * models; inside it, `fit` and `validation` choose their smoothing; `test`
 * is where the attack is measured, on text it has never seen.
 */
export const SPLIT = Object.freeze({
  training: Object.freeze(['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX']),
  fit: Object.freeze(['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']),
  validation: Object.freeze(['VIII', 'IX']),
  test: Object.freeze(['X', 'XI', 'XII']),
});

let corpusChecked = false;

/** Checks the corpus against its SHA-256 fingerprint, once: a changed character would change every number. */
function checkCorpus() {
  if (corpusChecked) return;
  const canonical = `${CHAPTERS.map((c) => `CHAPTER ${c.number}. ${c.title}\n${c.paragraphs.join('\n')}`).join('\n')}\n`;
  if (toHex(sha256(utf8(canonical))) !== CORPUS_SHA256) fail('the corpus does not match its SHA-256 fingerprint');
  corpusChecked = true;
}

/** The chapters of the corpus, with their number of letters. */
export function corpusChapters() {
  checkCorpus();
  return CHAPTERS.map((c) => ({ number: c.number, title: c.title, paragraphs: c.paragraphs.length, letters: c.paragraphs.reduce((s, p) => s + letterIndices(p).length, 0) }));
}

/** The text of some chapters, one paragraph per line. */
export function corpusText(numbers) {
  checkCorpus();
  return CHAPTERS.filter((c) => numbers.includes(c.number))
    .map((c) => c.paragraphs.join('\n'))
    .join('\n');
}

/** The orders of the Markov models of the letters: from n = 1 (single letters) to n = 4 (quadgrams). */
export const MAX_ORDER = 4;

/** The candidate strengths beta of the smoothing, chosen on the validation chapters. */
export const SMOOTHING_GRID = Object.freeze([0.1, 0.3, 1, 3, 10, 30, 100]);

/** The n-grams of a letter sequence, each counted at the index given by its letters as a number in base 26. */
function ngramCounts(letters, n) {
  const counts = new Float64Array(26 ** n);
  const keep = 26 ** (n - 1);
  let h = 0;
  for (let t = 0; t < letters.length; t++) {
    h = (h % keep) * 26 + letters[t];
    if (t >= n - 1) counts[h]++;
  }
  return counts;
}

/**
 * P(x | h) for every n-gram h x, smoothed toward the model of order n - 1
 * (the same context without its oldest letter, h'):
 * P_n(x | h) = (c(h x) + beta P_(n-1)(x | h')) / (c(h) + beta), and the
 * uniform 1/26 below order 1. A context seen often keeps its own counts,
 * one seen rarely borrows from the shorter context, and an unseen one is
 * the shorter context: the posterior mean under a Dirichlet prior centred
 * on the lower order, worth beta observations. Additive smoothing, which
 * would give an unseen context the uniform distribution, rewards the
 * nonsense of a wrong decryption.
 */
function smoothedProbabilities(counts, n, beta, lower) {
  const out = new Float64Array(counts.length);
  const keep = 26 ** Math.max(0, n - 2);
  for (let h = 0; h < counts.length / 26; h++) {
    let total = 0;
    for (let x = 0; x < 26; x++) total += counts[h * 26 + x];
    const base = (h % keep) * 26;
    for (let x = 0; x < 26; x++) {
      const prior = n === 1 ? 1 / 26 : lower[base + x];
      out[h * 26 + x] = (counts[h * 26 + x] + beta * prior) / (total + beta);
    }
  }
  return out;
}

/**
 * Natural log-likelihood of the letters (c - shift) mod 26 under a Markov
 * model of order n - 1 (an n-gram model): every letter is scored given the
 * n - 1 before it, and the first n - 1 letters with the lower orders.
 * `model.logs[j - 1]` is the table of the j-grams.
 */
function sequenceLogLikelihood(model, letters, shift = 0) {
  const n = model.logs.length;
  const keep = 26 ** (n - 1);
  let ctx = 0;
  let total = 0;
  for (let t = 0; t < letters.length; t++) {
    const idx = ctx * 26 + ((letters[t] - shift + 26) % 26);
    total += model.logs[Math.min(t, n - 1)][idx];
    ctx = idx % keep;
  }
  return total;
}

/** Cross-entropy of a letter sequence under a model, in bits per letter: how many bits per letter the model needs to encode it. */
const crossEntropyBits = (model, letters) => -sequenceLogLikelihood(model, letters) / (letters.length * Math.LN2);

/**
 * The smoothing of the language models, chosen without looking at the
 * test chapters: for every order n = 1..4, the beta of SMOOTHING_GRID
 * under which the validation chapters are most likely when the counts come
 * from the other training chapters (the lower orders keep the beta already
 * chosen for them). Returns the betas and the validation cross-entropies.
 */
export function* chooseSmoothingSteps() {
  const fitLetters = letterIndices(corpusText(SPLIT.fit));
  const validLetters = letterIndices(corpusText(SPLIT.validation));
  const logs = [];
  const betas = [];
  const validation = [];
  let lower = null;
  for (let n = 1; n <= MAX_ORDER; n++) {
    const counts = ngramCounts(fitLetters, n);
    let best = null;
    const row = [];
    for (const beta of SMOOTHING_GRID) {
      const probs = smoothedProbabilities(counts, n, beta, lower);
      const table = probs.map(Math.log);
      const h = crossEntropyBits({ logs: [...logs, table] }, validLetters);
      row.push(h);
      if (best === null || h < best.h) best = { beta, h, probs, table };
      yield;
    }
    betas.push(best.beta);
    validation.push(row);
    logs.push(best.table);
    lower = best.probs;
  }
  return { betas, validation };
}

const modelCache = new Map();

/**
 * The language models of the attack, estimated on all the training
 * chapters with the chosen smoothing: the tables of the n-grams for
 * n = 1..4, the letter frequencies q, the most frequent letter and the
 * vocabulary (the words seen in training, for the dictionary method).
 */
export function languageModels(betas) {
  const id = betas.join(',');
  if (modelCache.has(id)) return modelCache.get(id);
  const text = corpusText(SPLIT.training);
  const letters = letterIndices(text);
  const logs = [];
  let lower = null;
  betas.forEach((beta, i) => {
    lower = smoothedProbabilities(ngramCounts(letters, i + 1), i + 1, beta, lower);
    logs.push(lower.map(Math.log));
  });
  const counts = letterCounts(letters);
  const q = Array.from(logs[0], Math.exp);
  const vocabulary = new Set(wordsOf(text).map((w) => wordString(w)));
  const models = {
    betas: betas.slice(),
    logs,
    counts,
    letters: letters.length,
    q,
    top: q.indexOf(Math.max(...q)),
    vocabulary,
    order: (n) => ({ logs: logs.slice(0, n) }),
  };
  modelCache.set(id, models);
  return models;
}

let frequencies = null;

/** The letter frequencies of the training chapters, plain counts over the total: the reference of the charts. */
export function trainingFrequencies() {
  if (!frequencies) {
    const counts = letterCounts(letterIndices(corpusText(SPLIT.training)));
    const N = counts.reduce((s, c) => s + c, 0);
    frequencies = counts.map((c) => c / N);
  }
  return frequencies;
}

/** Shannon entropy of a distribution, in bits. */
export const entropyBits = (p) => -p.reduce((s, v) => (v > 0 ? s + v * Math.log2(v) : s), 0);

/** Index of coincidence: the probability that two symbols drawn without replacement are equal. */
export function coincidenceIndex(counts) {
  const N = counts.reduce((s, c) => s + c, 0);
  return N > 1 ? counts.reduce((s, c) => s + c * (c - 1), 0) / (N * (N - 1)) : NaN;
}

// ---------------------------------------------------------------------------
// 6. Statistical cryptanalysis of the Caesar cipher
// ---------------------------------------------------------------------------

/** The methods compared in section 3.4, from the least to the most information about the language. */
export const METHODS = Object.freeze(['top', 'chi2', 'unigram', 'bigram', 'quadgram', 'dictionary']);

/** What every method looks at in a ciphertext: its letters, their counts and its words. */
export function analyzeCiphertext(text) {
  const letters = letterIndices(text);
  return { letters, counts: letterCounts(letters), words: wordsOf(text) };
}

/**
 * The score of each of the 26 shifts s (decryption with s) for a
 * ciphertext, the higher the more plausible:
 *   top        the count of the ciphertext letter that s maps to the most
 *              frequent letter of the corpus (e);
 *   chi2       minus Pearson's chi-square between the decrypted letter
 *              counts and their expectation L q;
 *   unigram    the log-likelihood of the decrypted letters under the
 *              letter frequencies q: maximum likelihood;
 *   bigram, quadgram  the log-likelihood under the Markov models of order
 *              1 and 3 (n-gram scoring);
 *   dictionary the letters of the decrypted words that the corpus
 *              contains: exhaustive key search with a recognizer of words.
 */
export function shiftScores(method, a, models) {
  const scores = new Array(26).fill(0);
  const L = a.letters.length;
  for (let s = 0; s < 26; s++) {
    if (method === 'top') scores[s] = a.counts[(models.top + s) % 26];
    else if (method === 'chi2') {
      let chi2 = 0;
      for (let x = 0; x < 26; x++) {
        const e = L * models.q[x];
        chi2 += (a.counts[(x + s) % 26] - e) ** 2 / e;
      }
      scores[s] = L ? -chi2 : 0;
    } else if (method === 'unigram') {
      let ll = 0;
      for (let x = 0; x < 26; x++) ll += a.counts[(x + s) % 26] * models.logs[0][x];
      scores[s] = ll;
    } else if (method === 'bigram') scores[s] = sequenceLogLikelihood(models.order(2), a.letters, s);
    else if (method === 'quadgram') scores[s] = sequenceLogLikelihood(models.order(4), a.letters, s);
    else if (method === 'dictionary') {
      let found = 0;
      for (const w of a.words) if (models.vocabulary.has(wordString(w, s))) found += w.length;
      scores[s] = found;
    } else fail(`unknown method ${describe(method)}`);
  }
  return scores;
}

/** The shifts with the best score: more than one when they tie. */
export function bestShifts(scores) {
  const max = Math.max(...scores);
  const tolerance = 1e-9 * Math.max(1, Math.abs(max));
  return scores.flatMap((v, s) => (max - v <= tolerance ? [s] : []));
}

/** The posterior probability of each shift under a uniform prior, from log-likelihoods. */
export function posteriorOf(logLikelihoods) {
  const max = Math.max(...logLikelihoods);
  const w = logLikelihoods.map((v) => Math.exp(v - max));
  const z = w.reduce((s, v) => s + v, 0);
  return w.map((v) => v / z);
}

/**
 * The statistical attack on one ciphertext: the scores and the best shifts
 * of every method, the posterior of the shifts under the letter
 * frequencies, and the 26 candidate decryptions with their
 * log-likelihood. The recovered key is the maximum-likelihood shift.
 */
export function crackCaesar(ciphertext, models) {
  const a = analyzeCiphertext(ciphertext);
  const methods = {};
  for (const m of METHODS) {
    const scores = shiftScores(m, a, models);
    methods[m] = { scores, best: bestShifts(scores) };
  }
  const best = methods.unigram.best;
  const key = a.letters.length > 0 && best.length === 1 ? best[0] : null;
  const candidates = methods.unigram.scores.map((ll, s) => ({ shift: s, logLikelihood: ll, perLetter: a.letters.length ? ll / a.letters.length : NaN, text: caesarDecrypt(ciphertext, s) }));
  return {
    letters: a.letters.length,
    counts: a.counts,
    methods,
    posterior: posteriorOf(methods.unigram.scores),
    posteriorQuadgram: posteriorOf(methods.quadgram.scores),
    key,
    candidates,
    fit: key === null ? null : letterFit(a.counts, key, models),
  };
}

/**
 * The check of a decryption: the counts of its letters against L q, with
 * the chi-square goodness of fit of section 8. Under the right shift the
 * text should look like English; under any other it should not.
 */
export function letterFit(counts, shift, models) {
  const shifted = Array.from({ length: 26 }, (_, x) => counts[(x + shift) % 26]);
  return goodnessOfFit(shifted, models.q);
}

// ---------------------------------------------------------------------------
// 7. Attacks on the toy scheme
// ---------------------------------------------------------------------------

/** How many candidates the page tries by exhaustive search on the key of section 1, before extrapolating to the whole range. */
export const EXHAUSTIVE_LIMIT = 2 ** 20;

/** Seed of the kangaroos' starting offsets and of the keys of the scaling experiment. */
export const ATTACK_SEED = 2026;

/** Points walked together by the exhaustive search and by the giant steps: one inversion every LANES additions. */
const LANES = 256;

/**
 * Exhaustive search: k = 1, 2, 3, ... until kG = K, for at most `limit`
 * candidates. The candidates are walked in LANES parallel lanes (lane j
 * holds (t LANES + j + 1)G at round t, and a round adds LANES G to all of
 * them with one inversion), but checked in increasing order, so the
 * number tested is exactly k when k <= limit: one group operation per
 * candidate.
 */
export function* exhaustiveSteps(K, limit) {
  const started = now();
  const width = Math.max(1, Math.min(LANES, limit));
  const start = successiveMultiples(G, width);
  const xs = start.map((P) => P.x);
  const ys = start.map((P) => P.y);
  const step = start[width - 1];
  const qx = new Array(width).fill(step.x);
  const qy = new Array(width).fill(step.y);
  for (let base = 0; base < limit; base += width) {
    for (let j = 0; j < width && base + j < limit; j++) {
      if (xs[j] === K.x && ys[j] === K.y) return { found: true, key: base + j + 1, ops: base + j + 1, limit, ms: now() - started };
    }
    if (base + width >= limit) break;
    addInPlace(xs, ys, qx, qy);
    if ((base / width) % 8 === 7) yield;
  }
  return { found: false, key: null, ops: limit, limit, ms: now() - started };
}

const babyTables = new Map();

/**
 * The baby steps: x(jG) for j = 1..m in a hash table, with the parity of y
 * to tell jG from -jG. It does not depend on the key under attack: built
 * once for every m, it serves every key of the same size.
 */
function* babySteps(m) {
  if (babyTables.has(m)) return babyTables.get(m);
  const table = new Map();
  // the same lanes as the exhaustive search: lane j holds (t LANES + j + 1)G at round t
  const width = Math.min(LANES, m);
  const start = successiveMultiples(G, width);
  const xs = start.map((P) => P.x);
  const ys = start.map((P) => P.y);
  const step = start[width - 1];
  const qx = new Array(width).fill(step.x);
  const qy = new Array(width).fill(step.y);
  let last = null;
  for (let base = 0; base < m; base += width) {
    for (let j = 0; j < width && base + j < m; j++) {
      const id = xKey(xs[j]);
      if (!table.has(id)) table.set(id, 2 * (base + j + 1) + Number(ys[j] & 1n));
      if (base + j + 1 === m) last = { x: xs[j], y: ys[j] };
    }
    if (base + width >= m) break;
    addInPlace(xs, ys, qx, qy);
    if ((base / width) % 8 === 7) yield;
  }
  const entry = { table, mG: last };
  babyTables.set(m, entry);
  return entry;
}

/**
 * Baby-step giant-step (Shanks, 1971) for k in [1, 2^bits). With
 * m = 2^ceil(bits / 2), every k is i m + j with 0 <= i <= 2^bits / m and
 * 0 <= j <= m. The baby steps store x(jG) for j = 1..m; the giant steps
 * walk Q_i = K - i mG for i = 0, 1, ... until Q_i = jG (k = i m + j) or
 * Q_i = -jG (k = i m - j). About m + k / m group operations, at most about
 * 2 sqrt(2^bits), paid with a table of m points. The giant steps go in
 * LANES parallel lanes, checked in increasing i.
 */
export function* bsgsSteps(K, bits) {
  const started = now();
  const w = 2 ** bits;
  const m = 2 ** Math.ceil(bits / 2);
  const { table, mG } = yield* babySteps(m);
  const giants = Math.floor(w / m) + 1;
  const width = Math.min(LANES, giants);
  const negmG = negate(mG);
  const lanes = [];
  let acc = [K.x, K.y, 1n];
  for (let l = 0; l < width; l++) {
    lanes.push(acc);
    acc = jAddAffine(acc, negmG);
  }
  const start = toAffineAll(lanes);
  const xs = start.map((P) => (P === null ? null : P.x));
  const ys = start.map((P) => (P === null ? null : P.y));
  const step = negate(multiply(mG, BigInt(width)));
  const qx = new Array(width).fill(step.x);
  const qy = new Array(width).fill(step.y);
  const result = (key, i) => ({ found: true, key, ops: m + i, baby: m, giant: i + 1, table: table.size, bits, ms: now() - started });
  for (let base = 0; base < giants; base += width) {
    for (let l = 0; l < width && base + l < giants; l++) {
      const i = base + l;
      if (xs[l] === null) {
        // Q_i = O: K = i mG
        if (i * m >= 1 && i * m < w && pointsEqual(multiplyG(BigInt(i * m)), K)) return result(i * m, i);
        continue;
      }
      const v = table.get(xKey(xs[l]));
      if (v === undefined) continue;
      const j = Math.floor(v / 2);
      const k = (v & 1) === Number(ys[l] & 1n) ? i * m + j : i * m - j;
      if (k >= 1 && k < w && pointsEqual(multiplyG(BigInt(k)), K)) return result(k, i);
    }
    if (base + width >= giants) break;
    addInPlace(xs, ys, qx, qy);
    yield;
  }
  return { found: false, key: null, ops: m + giants, baby: m, giant: giants, table: table.size, bits, ms: now() - started };
}

/**
 * Pollard's kangaroo method (1978), in the parallel form of van Oorschot
 * and Wiener (1999), for k in [1, 2^bits). Two herds of `herd` kangaroos
 * jump along the group, each jump of 2^j G with j chosen by the current
 * point: the tame ones from known multiples of G in the middle of the
 * interval, the wild ones from K plus known offsets. The walk depends only
 * on the point, so a wild kangaroo that lands where a tame one has been
 * follows its trail from then on, and the meeting shows at the next
 * distinguished point (x with its lowest d bits at zero), stored with the
 * distance travelled: tame exponent = k + wild offset, and k follows.
 * About 2 sqrt(2^bits) jumps in all, and memory only for the
 * distinguished points. The mean jump N sqrt(2^bits) / 4, for N
 * kangaroos, is the one that minimizes the expected work.
 */
export function* kangarooSteps(K, bits, { seed = ATTACK_SEED, herd = 8 } = {}) {
  const started = now();
  const rand = prng(seed);
  const w = 2 ** bits;
  const N = 2 * herd;
  const target = (N * Math.sqrt(w)) / 4;
  const meanOf = (t) => (2 ** t - 1) / t;
  let t = 1;
  for (let c = 2; c <= 52; c++) if (Math.abs(meanOf(c) - target) < Math.abs(meanOf(t) - target)) t = c;
  const jumpPoints = [G];
  for (let j = 1; j < t; j++) jumpPoints.push(toAffine(jDouble([jumpPoints[j - 1].x, jumpPoints[j - 1].y, 1n])));
  const meanJump = meanOf(t);
  const dpBits = Math.max(0, Math.round(bits / 2 - Math.log2(N) - 3));
  const dpMask = BigInt(2 ** dpBits - 1);
  const spacing = Math.max(1, Math.round(meanJump / herd));
  const traps = new Map();
  let ops = 0;
  let sameHerd = 0;
  let restarts = 0;
  const limit = 64 * Math.sqrt(w) + 64 * N * 2 ** dpBits + 1024;
  for (;;) {
    // tame kangaroos: exponent w/2 + i * spacing; wild ones: k + offset, offset = i * spacing (+ a random shift after a restart)
    const shift = restarts === 0 ? 0 : Math.floor(rand() * meanJump);
    const tame = [];
    const exps = [];
    for (let i = 0; i < N; i++) {
      const isTame = i < herd;
      const e = isTame ? Math.floor(w / 2) + (i % herd) * spacing + shift : (i % herd) * spacing + shift;
      tame.push(isTame);
      exps.push(e);
    }
    const startPoints = exps.map((e, i) => (tame[i] ? multiplyG(BigInt(e)) : e === 0 ? K : addPoints(K, multiplyG(BigInt(e)))));
    const xs = startPoints.map((P) => P.x);
    const ys = startPoints.map((P) => P.y);
    const qx = new Array(N);
    const qy = new Array(N);
    let rounds = 0;
    const roundLimit = Math.ceil(limit / N);
    while (rounds < roundLimit) {
      for (let i = 0; i < N; i++) {
        const j = Number((xs[i] >> 64n) & 0xffffn) % t;
        qx[i] = jumpPoints[j].x;
        qy[i] = jumpPoints[j].y;
        exps[i] += 2 ** j;
      }
      addInPlace(xs, ys, qx, qy);
      ops += N;
      rounds++;
      for (let i = 0; i < N; i++) {
        if ((xs[i] & dpMask) !== 0n) continue;
        const id = xKey(xs[i]);
        const seen = traps.get(id);
        if (seen === undefined) {
          traps.set(id, { tame: tame[i], e: exps[i] });
        } else if (seen.tame !== tame[i]) {
          const k = tame[i] ? exps[i] - seen.e : seen.e - exps[i];
          if (k >= 1 && k < w && pointsEqual(multiplyG(BigInt(k)), K)) {
            return { found: true, key: k, ops, herd, N, meanJump, jumps: t, dpBits, distinguished: traps.size, sameHerd, restarts, expected: 2 * Math.sqrt(w) + N * 2 ** dpBits, bits, ms: now() - started };
          }
        } else {
          // two kangaroos of the same herd on the same trail: this one moves on by a random distance
          sameHerd++;
          const r = 1 + Math.floor(rand() * meanJump);
          const P = addPoints({ x: xs[i], y: ys[i] }, multiplyG(BigInt(r)));
          xs[i] = P.x;
          ys[i] = P.y;
          exps[i] += r;
          ops++;
        }
      }
      if (rounds % 64 === 0) yield;
    }
    restarts++;
    if (restarts > 8) return { found: false, key: null, ops, herd, N, meanJump, jumps: t, dpBits, distinguished: traps.size, sameHerd, restarts, expected: 2 * Math.sqrt(w) + N * 2 ** dpBits, bits, ms: now() - started };
    traps.clear();
  }
}

/** Runs one of the generators above to the end, in one go (a worker, the command line). */
export function runSteps(steps) {
  let step = steps.next();
  while (!step.done) step = steps.next();
  return step.value;
}

/** Runs a generator in slices of a few milliseconds, leaving the browser free to draw in between. */
export function runStepsAsync(makeSteps, { sliceMs = 12, schedule = (run) => setTimeout(run, 0) } = {}) {
  return new Promise((resolve, reject) => {
    let steps;
    try {
      steps = makeSteps();
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

/** The public key as the attacks receive it: the compressed point, checked to be on the curve. */
export const publicKeyFromHex = (hex) => decodeCompressed(fromHex(hex));

/** The three attacks of section 4 on a public key of the toy scheme, by name: exhaustive search on the first EXHAUSTIVE_LIMIT candidates, baby-step giant-step and kangaroo on the whole 32-bit range. */
export function attackSteps(name, publicKeyHexValue) {
  const K = publicKeyFromHex(publicKeyHexValue);
  if (name === 'exhaustive') return exhaustiveSteps(K, EXHAUSTIVE_LIMIT);
  if (name === 'bsgs') return bsgsSteps(K, KEY_BITS);
  if (name === 'kangaroo') return kangarooSteps(K, KEY_BITS);
  return fail(`unknown attack ${describe(name)}`);
}

/** A nonce used for every byte by the flawed variant of section 4.8. */
export const REUSED_NONCE = seededNonce(0, `${NONCE_SEED} (reused)`);

let byteModel = null;

/**
 * The frequencies of the 256 byte values in the UTF-8 text of the training
 * chapters, with add-1/2 smoothing: a model of English text byte by byte,
 * spaces and punctuation included.
 */
function byteLogs() {
  if (!byteModel) {
    const counts = new Array(256).fill(0);
    for (const b of utf8(corpusText(SPLIT.training))) counts[b]++;
    const total = counts.reduce((s, c) => s + c, 0);
    byteModel = counts.map((c) => Math.log((c + 0.5) / (total + 128)));
  }
  return byteModel;
}

/**
 * The attack on the flawed variant with one nonce for every byte. All C1
 * are equal, and C2_i = b_i G + S with the same S: the differences
 * C2_i - C2_0 = (b_i - b_0) G give b_i - b_0, a discrete logarithm in
 * [-255, 255] read from the table of the 256 points. The message is then
 * known up to the single byte b_0: a Caesar cipher on the byte values,
 * broken like the one of section 3, here with the byte frequencies of the
 * corpus. No private key and no large logarithm are needed.
 */
export function nonceReuseAttack(blocks) {
  if (!blocks.length) return null;
  const sameC1 = blocks.every((b) => pointsEqual(b.C1, blocks[0].C1));
  const diffs = blocks.map((b) => {
    const D = subtractPoints(b.C2, blocks[0].C2);
    if (D === null) return 0;
    const plus = decodeByte(D);
    if (plus >= 0) return plus;
    const minus = decodeByte(negate(D));
    return minus >= 0 ? -minus : null;
  });
  if (diffs.includes(null)) return { sameC1, diffs: null, candidates: [], valid: 0 };
  const logs = byteLogs();
  const lo = -Math.min(...diffs);
  const hi = 255 - Math.max(...diffs);
  const candidates = [];
  for (let b0 = lo; b0 <= hi; b0++) {
    const bytes = Uint8Array.from(diffs, (d) => b0 + d);
    const text = utf8Decode(bytes);
    if (text === null) continue;
    candidates.push({ b0, text, score: bytes.reduce((s, b) => s + logs[b], 0) });
  }
  candidates.sort((a, b) => b.score - a.score);
  return { sameC1, diffs, candidates: candidates.slice(0, 5), valid: candidates.length, range: hi - lo + 1 };
}

/**
 * The ciphertext with delta G added to every C2: with the same k it
 * decrypts to every byte plus delta. Nobody needs k to do it: the scheme
 * is malleable, and with delta = 1 this is the cipher of Augustus, one
 * letter forward, applied to an encrypted message.
 */
export function shiftCiphertext(blocks, delta) {
  const D = delta >= 0 ? encodeByte(delta) : negate(encodeByte(-delta));
  return blocks.map((b) => ({ C1: b.C1, C2: addPoints(b.C2, D) }));
}

// ---------------------------------------------------------------------------
// 8. Statistics: hypothesis tests and experiments
// ---------------------------------------------------------------------------

export const SIGNIFICANCE = 0.05;

/** Seed of the generator of the experiments' random choices: passages, keys, samples. */
export const EXPLORE_SEED = 2026;

/**
 * Sizes of the experiments, chosen so that the computations take a few
 * seconds. The random choices come from a seeded generator, so the page,
 * the downloadable program and the command line print the same numbers
 * (except the times, which depend on the machine).
 */
export const SAMPLES = Object.freeze({
  maxTrials: 2000, // ciphertexts per length in the Caesar experiment, fewer when the test chapters do not hold that many disjoint passages
  ecBytes: 1500, // bytes of test text encrypted with the toy scheme, for the statistics of its ciphertext
  keys: 400, // public keys of 32-bit private keys, and as many of full-range ones
});

/** The lengths of the Caesar ciphertexts, in letters. */
export const LENGTHS = Object.freeze([1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 75, 100, 150, 200]);

/** The key sizes, in bits, of the scaling experiment of the attacks, and how many keys are drawn for each. */
export const SCALING = Object.freeze({
  exhaustive: Object.freeze({ bits: Object.freeze([8, 10, 12, 14]), trials: 16 }),
  bsgs: Object.freeze({ bits: Object.freeze([8, 12, 16, 20, 24, 28, 32]), trials: 12 }),
  kangaroo: Object.freeze({ bits: Object.freeze([8, 12, 16, 20, 24, 28]), trials: 8 }),
});

/** The exponent of every attack according to the theory: about c 2^(exponent x bits) group operations. */
export const THEORY = Object.freeze({ exhaustive: 1, bsgs: 0.5, kangaroo: 0.5 });

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
  const excess = Math.abs(successes - mean) - 0.5;
  const z = sd > 0 && excess > 0 ? (Math.sign(successes - mean) * excess) / sd : 0;
  return finish({ kind: 'binomial', successes, trials, expectedRate: p, rate: successes / trials, z, pValue: twoSidedNormalTail(z) });
}

/**
 * Chi-square goodness of fit of counts against probabilities. Neighbouring
 * classes are merged until each expects at least 5 observations (Cochran),
 * so that the chi-square approximation holds.
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

/**
 * Chi-square test of independence on a contingency table of counts: the
 * expected counts come from the margins, with (r - 1)(c - 1) degrees of
 * freedom. Cramer's V = sqrt(chi2 / (N (min(r, c) - 1))) measures the
 * strength of the dependence, from 0 (none) to 1 (each row determines the
 * column). Empty rows and columns are left out.
 */
export function independenceTest(table) {
  const rowsAll = table.map((row) => row.reduce((s, v) => s + v, 0));
  const colsAll = table[0].map((_, j) => table.reduce((s, row) => s + row[j], 0));
  const rows = table.filter((_, i) => rowsAll[i] > 0).map((row) => row.filter((_, j) => colsAll[j] > 0));
  const R = rows.length;
  const C = R ? rows[0].length : 0;
  const rowSums = rows.map((row) => row.reduce((s, v) => s + v, 0));
  const colSums = Array.from({ length: C }, (_, j) => rows.reduce((s, row) => s + row[j], 0));
  const N = rowSums.reduce((s, v) => s + v, 0);
  let chi2 = 0;
  let minExpected = Infinity;
  for (let i = 0; i < R; i++) {
    for (let j = 0; j < C; j++) {
      const e = (rowSums[i] * colSums[j]) / N;
      minExpected = Math.min(minExpected, e);
      chi2 += (rows[i][j] - e) ** 2 / e;
    }
  }
  const df = (R - 1) * (C - 1);
  return finish({ kind: 'independence', N, rows: R, cols: C, df, chi2, minExpected, cramerV: Math.sqrt(chi2 / (N * (Math.min(R, C) - 1))), pValue: df > 0 ? chiSquarePValue(chi2, df) : NaN });
}

/** Wilson score interval of a proportion (95%): unlike p +- 1.96 sd, it stays inside [0, 1] and works near 0 and 1. */
export function wilsonInterval(rate, n, z = 1.959963984540054) {
  if (!(n > 0)) return [NaN, NaN];
  const z2 = z * z;
  const center = (rate + z2 / (2 * n)) / (1 + z2 / n);
  const half = (z * Math.sqrt((rate * (1 - rate)) / n + z2 / (4 * n * n))) / (1 + z2 / n);
  return [Math.max(0, center - half), Math.min(1, center + half)];
}

/**
 * Share of ones at every bit position of a list of equally long byte
 * arrays, with a z-score per position against 1/2 and the global test
 * sum(z^2) ~ chi-square(positions): for uniform outputs every bit is an
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
  return {
    N,
    bits,
    fractions,
    z,
    beyond3: z.filter((v) => Math.abs(v) > 3).length,
    global: finish({ kind: 'chi2', chi2: z2, df: bits, pValue: chiSquarePValue(z2, bits) }),
  };
}

/** Total variation distance between two distributions: the largest difference in the probability of any set of outcomes. */
const totalVariation = (p, q) => p.reduce((s, v, i) => s + Math.abs(v - q[i]), 0) / 2;

const normalize = (counts) => {
  const N = counts.reduce((s, c) => s + c, 0);
  return counts.map((c) => c / N);
};

/**
 * Chernoff's bound on the error of maximum likelihood with i.i.d. letters
 * from q: the true shift loses to the wrong shift d with probability at
 * most rho_d^L, rho_d = min over lambda of sum_x q(x)^(1 - lambda)
 * q(x - d)^lambda (lambda = 1/2 gives the Bhattacharyya coefficient), and
 * a union over the 25 wrong shifts bounds the error by sum_d rho_d^L. The
 * largest rho_d belongs to the shift most easily confused with the right
 * one, and fixes the exponential rate at which the error vanishes.
 */
export function chernoffRates(q) {
  const f = (d, lambda) => q.reduce((s, v, x) => s + v ** (1 - lambda) * q[(x - d + 26) % 26] ** lambda, 0);
  const rho = [NaN];
  for (let d = 1; d < 26; d++) {
    // golden-section search: f is convex in lambda, with f(0) = f(1) = 1
    let a = 0;
    let b = 1;
    const g = (Math.sqrt(5) - 1) / 2;
    for (let it = 0; it < 60; it++) {
      const c = b - g * (b - a);
      const e = a + g * (b - a);
      if (f(d, c) < f(d, e)) b = e;
      else a = c;
    }
    rho.push(f(d, (a + b) / 2));
  }
  return rho;
}

/** The lower bound on the success of maximum likelihood with L i.i.d. letters, from chernoffRates. */
export const chernoffSuccess = (rho, L) => Math.max(0, 1 - rho.slice(1).reduce((s, r) => s + r ** L, 0));

/** The longest prefix of a text whose UTF-8 encoding fits in `bytes` bytes. */
function prefixWithin(text, bytes) {
  let used = 0;
  let end = 0;
  for (const ch of text) {
    const size = utf8(ch).length;
    if (used + size > bytes) break;
    used += size;
    end += ch.length;
  }
  return text.slice(0, end);
}

/** The class of a plaintext byte in the independence tests: space, e, t, a, o, another letter, anything else. */
const BYTE_CLASSES = [32, 101, 116, 97, 111];
const byteClass = (b) => {
  const lower = b >= 65 && b <= 90 ? b + 32 : b;
  const i = BYTE_CLASSES.indexOf(lower);
  if (i >= 0) return i;
  return lower >= 97 && lower <= 122 ? 5 : 6;
};

/**
 * The statistical exploration, as a generator that yields between units
 * of work (a page can run it in slices, a worker or the command line in
 * one go):
 *   - the corpus: letter frequencies of training and test chapters;
 *   - the language models: smoothing chosen on validation chapters, and
 *     their cross-entropy on the test chapters;
 *   - the Caesar experiment: every method on disjoint passages of the test
 *     chapters, for every length of LENGTHS, each passage under a random
 *     shift;
 *   - the two ciphertexts of the same test text, Caesar and toy scheme;
 *   - the public keys of 32-bit and of full-range private keys.
 */
export function* exploreSteps({ seed = EXPLORE_SEED } = {}) {
  const rand = prng(seed);
  const result = { seed, samples: SAMPLES };

  // --- The corpus and the language models -------------------------------
  const chapters = corpusChapters();
  const trainingLetters = letterIndices(corpusText(SPLIT.training));
  const testText = corpusText(SPLIT.test);
  const testLetters = letterIndices(testText);
  const trainingCounts = letterCounts(trainingLetters);
  const testCounts = letterCounts(testLetters);
  yield;
  const smoothing = yield* chooseSmoothingSteps();
  const models = languageModels(smoothing.betas);
  const crossEntropy = [];
  for (let n = 1; n <= MAX_ORDER; n++) crossEntropy.push(crossEntropyBits(models.order(n), testLetters));
  const maxEntropy = Math.log2(26);
  result.corpus = {
    chapters,
    split: SPLIT,
    training: { letters: trainingLetters.length, counts: trainingCounts, ic: coincidenceIndex(trainingCounts), entropy: entropyBits(normalize(trainingCounts)) },
    test: { letters: testLetters.length, counts: testCounts, ic: coincidenceIndex(testCounts), entropy: entropyBits(normalize(testCounts)) },
    homogeneity: independenceTest([trainingCounts, testCounts]),
    tvd: totalVariation(normalize(trainingCounts), normalize(testCounts)),
    vocabulary: models.vocabulary.size,
  };
  result.models = {
    betas: smoothing.betas,
    grid: SMOOTHING_GRID,
    validation: smoothing.validation,
    crossEntropy,
    maxEntropy,
    redundancy: crossEntropy.map((h) => maxEntropy - h),
    unicity: crossEntropy.map((h) => maxEntropy / (maxEntropy - h)),
    q: models.q,
    top: models.top,
  };
  yield;

  // --- The Caesar experiment ---------------------------------------------
  const positions = [];
  for (let i = 0; i < testText.length; i++) {
    const c = testText.charCodeAt(i);
    if (isUpper(c) || isLower(c)) positions.push(i);
  }
  const trials = [];
  const sums = Object.fromEntries(METHODS.map((m) => [m, []]));
  for (const L of LENGTHS) {
    const blocks = Math.floor(positions.length / L);
    const order = Array.from({ length: blocks }, (_, b) => b);
    for (let t = order.length - 1; t > 0; t--) {
      const r = Math.floor(rand() * (t + 1));
      [order[t], order[r]] = [order[r], order[t]];
    }
    const n = Math.min(SAMPLES.maxTrials, blocks);
    const total = Object.fromEntries(METHODS.map((m) => [m, 0]));
    for (let t = 0; t < n; t++) {
      const b = order[t];
      const passage = testText.slice(positions[b * L], positions[b * L + L - 1] + 1);
      const shift = Math.floor(rand() * 26);
      const a = analyzeCiphertext(caesar(passage, shift));
      for (const m of METHODS) {
        const best = bestShifts(shiftScores(m, a, models));
        if (best.includes(shift)) total[m] += 1 / best.length;
      }
      if (t % 50 === 49) yield;
    }
    trials.push(n);
    for (const m of METHODS) sums[m].push(total[m] / n);
    yield;
  }
  const rho = chernoffRates(models.q);
  const confusable = rho.reduce((best, r, d) => (d > 0 && (best === 0 || r > rho[best]) ? d : best), 0);
  result.caesar = {
    lengths: LENGTHS,
    trials,
    rates: sums,
    intervals: Object.fromEntries(METHODS.map((m) => [m, sums[m].map((r, i) => wilsonInterval(r, trials[i]))])),
    bound: LENGTHS.map((L) => chernoffSuccess(rho, L)),
    rho,
    confusable: { shift: confusable, rho: rho[confusable] },
  };
  yield;

  // --- The same text through both ciphers --------------------------------
  const sampleText = prefixWithin(testText, SAMPLES.ecBytes);
  const scheme = toyScheme(DEFAULT_KEY, { nonces: (i) => seededNonce(i, `${NONCE_SEED} (statistics)`) });
  const { bytes, blocks } = yield* scheme.encryptSteps(sampleText);
  const byteCounts = new Array(256).fill(0);
  const independence = Array.from({ length: BYTE_CLASSES.length + 2 }, () => [0, 0, 0, 0]);
  let odd = 0;
  for (const b of blocks) {
    for (const v of ser256(b.C1.x)) byteCounts[v]++;
    for (const v of ser256(b.C2.x)) byteCounts[v]++;
    if (b.C2.y & 1n) odd++;
    independence[byteClass(b.byte)][Number(b.C2.x >> 254n)]++;
  }
  const plainLetters = letterIndices(sampleText);
  const cipherText = caesar(sampleText, DEFAULT_SHIFT);
  const cipherLetters = letterIndices(cipherText);
  const plainCounts = letterCounts(plainLetters);
  const cipherCounts = letterCounts(cipherLetters);
  // the five classes of the most frequent plaintext letters and the classes of their images
  const topLetters = plainCounts.map((c, x) => [c, x]).sort((a, b) => b[0] - a[0]).slice(0, 4).map(([, x]) => x);
  const letterClass = (x) => (topLetters.includes(x) ? topLetters.indexOf(x) : 4);
  const caesarTable = Array.from({ length: 5 }, () => new Array(5).fill(0));
  plainLetters.forEach((x, i) => {
    caesarTable[letterClass(x)][letterClass((cipherLetters[i] - DEFAULT_SHIFT + 26) % 26)]++;
  });
  const top = topLetters[0];
  const topBlocks = blocks.filter((b) => b.byte === 97 + top);
  result.ciphers = {
    text: sampleText,
    bytes: bytes.length,
    shift: DEFAULT_SHIFT,
    plain: { letters: plainLetters.length, counts: plainCounts, ic: coincidenceIndex(plainCounts), entropy: entropyBits(normalize(plainCounts)) },
    caesar: {
      counts: cipherCounts,
      ic: coincidenceIndex(cipherCounts),
      entropy: entropyBits(normalize(cipherCounts)),
      uniform: goodnessOfFit(cipherCounts, new Array(26).fill(1 / 26)),
      dependence: independenceTest(caesarTable),
      topLetters,
    },
    ec: {
      counts: byteCounts,
      ic: coincidenceIndex(byteCounts),
      entropy: entropyBits(normalize(byteCounts)),
      uniform: goodnessOfFit(byteCounts, new Array(256).fill(1 / 256)),
      parity: binomialTest(odd, blocks.length, 0.5),
      independence: independenceTest(independence),
      bytesPerBlock: 66,
    },
    repeated: {
      letter: top,
      occurrences: topBlocks.length,
      caesarDistinct: new Set(topBlocks.map((b) => caesar(String.fromCharCode(b.byte), DEFAULT_SHIFT))).size,
      ecDistinct: new Set(topBlocks.map((b) => pointHex(b.C2))).size,
    },
  };
  yield;

  // --- Public keys of 32-bit and of full-range private keys --------------
  const small = [];
  const full = [];
  for (let i = 0; i < SAMPLES.keys; i++) {
    const k = 1n + BigInt(Math.floor(rand() * 4294967295));
    small.push(ser256(multiplyG(k).x));
    const r = (bytesToBigInt(randomBytesFrom(rand, 32)) % (CURVE_N - 1n)) + 1n;
    full.push(ser256(multiplyG(r).x));
    if (i % 20 === 19) yield;
  }
  result.keys = { small: bitBalance(small, 256), full: bitBalance(full, 256) };
  return result;
}

/** The whole exploration in one go: for a worker, the command line and the tests. */
export const explore = (options) => runSteps(exploreSteps(options));

/** The exploration in slices of a few milliseconds, with the browser free to draw in between. */
export const exploreAsync = (options, scheduling) => runStepsAsync(() => exploreSteps(options), scheduling);

/** Least-squares line y = intercept + slope x, with the standard error of the slope. */
function fitLine(xs, ys) {
  const n = xs.length;
  const mx = xs.reduce((s, v) => s + v, 0) / n;
  const my = ys.reduce((s, v) => s + v, 0) / n;
  let sxy = 0;
  let sxx = 0;
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
  }
  const slope = sxy / sxx;
  const intercept = my - slope * mx;
  const residuals = xs.reduce((s, x, i) => s + (ys[i] - intercept - slope * x) ** 2, 0);
  return { slope, intercept, slopeError: n > 2 ? Math.sqrt(residuals / (n - 2) / sxx) : NaN };
}

/**
 * How the cost of the three attacks grows with the size of the key: for
 * every size of SCALING, keys drawn uniformly in [1, 2^bits) from the
 * seeded generator, attacked by each method. The group operations do not
 * depend on the machine (exhaustive search: exactly k; baby-step
 * giant-step: m + floor(k / m); kangaroo: the jumps until the meeting);
 * the times do. A line fitted to log2(mean operations) against the bits
 * estimates the exponent; the extrapolation to 256 bits keeps the
 * exponent of the theory and estimates only the constant, because an
 * error of 0.02 in a fitted slope would become a factor 2^5 at 256 bits.
 */
export function* scalingSteps({ seed = ATTACK_SEED } = {}) {
  const rand = prng(seed + 1);
  const rows = { exhaustive: [], bsgs: [], kangaroo: [] };
  const timing = { exhaustive: { ops: 0, ms: 0 }, bsgs: { ops: 0, ms: 0 }, kangaroo: { ops: 0, ms: 0 } };
  for (const method of ['exhaustive', 'bsgs', 'kangaroo']) {
    for (const bits of SCALING[method].bits) {
      const ops = [];
      const ms = [];
      for (let t = 0; t < SCALING[method].trials; t++) {
        const k = 1 + Math.floor(rand() * (2 ** bits - 1));
        const K = multiplyG(BigInt(k));
        let r;
        if (method === 'exhaustive') r = yield* exhaustiveSteps(K, 2 ** bits);
        else if (method === 'bsgs') r = yield* bsgsSteps(K, bits);
        else r = yield* kangarooSteps(K, bits, { seed: seed + 7 * t + bits });
        if (!r.found || r.key !== k) fail(`${method}: wrong key for ${bits} bits`);
        ops.push(r.ops);
        ms.push(r.ms);
        timing[method].ops += r.ops;
        timing[method].ms += r.ms;
      }
      rows[method].push({ bits, ops, ms, mean: ops.reduce((s, v) => s + v, 0) / ops.length });
    }
  }
  const fits = {};
  for (const method of Object.keys(rows)) {
    const bits = rows[method].map((r) => r.bits);
    const logs = rows[method].map((r) => Math.log2(r.mean));
    const free = fitLine(bits, logs);
    const constant = logs.reduce((s, v, i) => s + v - THEORY[method] * bits[i], 0) / logs.length;
    fits[method] = { ...free, exponent: THEORY[method], constant };
  }
  // group operations per second on this machine: those of the exhaustive search, nothing but additions
  const rate = timing.exhaustive.ms > 0 ? (1000 * timing.exhaustive.ops) / timing.exhaustive.ms : NaN;
  return { seed: seed + 1, rows, fits, rate, timing };
}

/** The scaling experiment in one go, or in slices. */
export const scaling = (options) => runSteps(scalingSteps(options));
export const scalingAsync = (options, scheduling) => runStepsAsync(() => scalingSteps(options), scheduling);

/**
 * Every hypothesis test of the exploration, by subject, as [key, test]
 * pairs: the page, the downloadable program and the command line list the
 * same tests in the same order.
 */
export function statisticalTests(s) {
  return {
    corpus: [['homogeneity', s.corpus.homogeneity]],
    caesar: [
      ['uniform', s.ciphers.caesar.uniform],
      ['dependence', s.ciphers.caesar.dependence],
    ],
    ec: [
      ['uniform', s.ciphers.ec.uniform],
      ['parity', s.ciphers.ec.parity],
      ['independence', s.ciphers.ec.independence],
    ],
    keys: [
      ['small', s.keys.small.global],
      ['full', s.keys.full.global],
    ],
  };
}

/** The null hypothesis of every test, in English (the page has them in Italian too). */
export const TEST_LABELS = Object.freeze({
  corpus: {
    homogeneity: 'Training and test chapters have the same letter frequencies (chi-square, 2 x 26)',
  },
  caesar: {
    uniform: 'The letters of the Caesar ciphertext are uniform over the 26 (chi-square)',
    dependence: 'Plaintext letter and ciphertext letter are independent (chi-square, Caesar)',
  },
  ec: {
    uniform: 'The bytes of x(C1) and x(C2) are uniform over the 256 values (chi-square)',
    parity: 'The y of C2 is odd with probability 1/2 (binomial)',
    independence: 'Plaintext byte and first 2 bits of x(C2) are independent (chi-square)',
  },
  keys: {
    small: 'The bits of x(kG) are fair coins for 32-bit keys: sum z^2 ~ chi-square(256)',
    full: 'The bits of x(kG) are fair coins for full-range keys: sum z^2 ~ chi-square(256)',
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
  highlight: '#d52349',
  series: ['#5c6bc0', '#d52349', '#2e7d6b', '#f0a500', '#8e24aa', '#00838f', '#777777'],
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
const LINE_ASPECT = 0.56;
const LINE_MARGIN = { left: 40, right: 12, top: 10, bottom: 24 };

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

/**
 * Bar chart of `values` with an optional dashed reference (`expected`, one
 * value per bar or a single number), labels under the first, the middle
 * and the last bar (or under every bar, with `allLabels`), and the bars of
 * `highlight` in another colour. With more bars than pixels each pixel
 * column shows the largest of its bars, so that no value disappears.
 */
export function drawBarChart(canvas, { values, expected = null, labels = null, allLabels = false, highlight = [], max = null, decimal = '.', width: knownWidth = 0 }, palette = DEFAULT_PALETTE) {
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
  for (let c = 0; c < columns; c++) {
    const from = Math.floor(c * perColumn);
    const to = Math.max(Math.floor((c + 1) * perColumn), from + 1);
    let v = 0;
    let marked = false;
    for (let i = from; i < to; i++) {
      v = Math.max(v, values[i] ?? 0);
      if (highlight.includes(i)) marked = true;
    }
    const bh = (v / top) * h;
    ctx.fillStyle = marked ? pal.highlight : pal.bars;
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
    const shown = allLabels && barW >= 9 ? labels.map((_, i) => i) : [...new Set([0, Math.floor((labels.length - 1) / 2), labels.length - 1])];
    for (const i of shown) ctx.fillText(labels[i], margin.left + (i + 0.5) * barW, margin.top + h + 15);
  }
}

/** Where the plot of drawLineChart lies on a canvas of this width, and the pixel of every x value. */
function lineLayout(data, width) {
  const height = Math.round(width * LINE_ASPECT);
  const margin = LINE_MARGIN;
  const w = width - margin.left - margin.right;
  const h = height - margin.top - margin.bottom;
  const x0 = data.x[0];
  const x1 = data.x[data.x.length - 1];
  const scale = (v) => (data.logX ? (Math.log(v) - Math.log(x0)) / (Math.log(x1) - Math.log(x0)) : (v - x0) / (x1 - x0));
  const px = (v) => margin.left + w * scale(v);
  return { margin, w, h, height, px, xs: data.x.map(px) };
}

/**
 * Line chart: one line per series over the same x values, on a linear or
 * logarithmic x axis, each with an optional shaded band (a confidence
 * interval) and optionally dashed (a bound, a theoretical line); null
 * values are skipped. The colours are palette.series in order, or the one
 * of `colorIndex`; the legend is written in the page, under the figure,
 * where it can be read and translated.
 */
export function drawLineChart(canvas, { x, series, logX = false, yMin = 0, yMax = 1, yTicks = [], xTicks = [], yFormat = (v) => String(v), decimal = '.', width: knownWidth = 0 }, palette = DEFAULT_PALETTE) {
  const pal = { ...DEFAULT_PALETTE, ...palette };
  const { ctx, width, height } = setupCanvas(canvas, LINE_ASPECT, knownWidth);
  const { margin, w, h, px } = lineLayout({ x, logX }, width);
  const py = (v) => margin.top + h * (1 - (Math.min(yMax, Math.max(yMin, v)) - yMin) / (yMax - yMin));
  ctx.fillStyle = pal.background;
  ctx.fillRect(0, 0, width, height);
  ctx.font = '11px sans-serif';
  ctx.strokeStyle = pal.grid;
  ctx.lineWidth = 1;
  ctx.fillStyle = pal.text;
  ctx.textAlign = 'right';
  for (const v of yTicks) {
    ctx.beginPath();
    ctx.moveTo(margin.left, py(v));
    ctx.lineTo(margin.left + w, py(v));
    ctx.stroke();
    ctx.fillText(chartNumber(yFormat(v), decimal), margin.left - 4, py(v) + 4);
  }
  ctx.textAlign = 'center';
  for (const v of xTicks) {
    ctx.beginPath();
    ctx.moveTo(px(v), margin.top);
    ctx.lineTo(px(v), margin.top + h);
    ctx.stroke();
    ctx.fillText(chartNumber(String(v), decimal), px(v), margin.top + h + 15);
  }
  ctx.strokeRect(margin.left, margin.top, w, h);
  series.forEach((s, i) => {
    const color = pal.series[(s.colorIndex ?? i) % pal.series.length];
    const points = x.map((v, j) => [px(v), s.values[j]]).filter(([, v]) => v !== null && v !== undefined && !Number.isNaN(v));
    if (s.band) {
      ctx.globalAlpha = 0.14;
      ctx.fillStyle = color;
      ctx.beginPath();
      x.forEach((v, j) => (j ? ctx.lineTo(px(v), py(s.band[j][1])) : ctx.moveTo(px(v), py(s.band[j][1]))));
      for (let j = x.length - 1; j >= 0; j--) ctx.lineTo(px(x[j]), py(s.band[j][0]));
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = s.dashed ? 1.5 : 2;
    ctx.setLineDash(s.dashed ? [5, 4] : []);
    ctx.beginPath();
    points.forEach(([X, v], j) => (j ? ctx.lineTo(X, py(v)) : ctx.moveTo(X, py(v))));
    ctx.stroke();
    ctx.setLineDash([]);
    if (!s.dashed) {
      ctx.fillStyle = color;
      for (const [X, v] of points) {
        ctx.beginPath();
        ctx.arc(X, py(v), 2.4, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  });
}

/** The height that a chart function gives a canvas of this width, to reserve the space before drawing. */
export function chartHeight(draw, data, width) {
  return draw === drawLineChart ? lineLayout(data, width).height : barLayout(data.values.length, width).height;
}

/**
 * The bar or the x value under the point (x, y) of a chart drawn at this
 * width, in CSS pixels from its top left corner; null outside the plot.
 * For bars, the values [from, to) of the pixel column (more than one when
 * there are more bars than pixels); for lines, the index of the nearest x.
 * `rect` is the rectangle to outline.
 */
export function chartHitTest(draw, data, width, x, y) {
  if (draw === drawLineChart) {
    const { margin, h, w, xs } = lineLayout(data, width);
    if (x < margin.left - 6 || x > margin.left + w + 6 || y < margin.top || y > margin.top + h) return null;
    let index = 0;
    xs.forEach((X, i) => {
      if (Math.abs(X - x) < Math.abs(xs[index] - x)) index = i;
    });
    return { kind: 'point', index, rect: { x: xs[index] - 3, y: margin.top, width: 6, height: h } };
  }
  const { margin, w, h, columns, perColumn, colW } = barLayout(data.values.length, width);
  if (x < margin.left || x >= margin.left + w || y < margin.top || y > margin.top + h) return null;
  const column = Math.min(columns - 1, Math.floor((x - margin.left) / colW));
  const from = Math.floor(column * perColumn);
  const to = Math.max(Math.floor((column + 1) * perColumn), from + 1);
  return { kind: 'bar', from, to, rect: { x: margin.left + column * colW, y: margin.top, width: colW, height: h } };
}

/**
 * Explains a chart under the pointer: the bar or the point below the
 * mouse, or below the finger after a tap, gets an outline and a label with
 * the text describe(hit), inserted as plain text. Both stay inside the
 * canvas's parent, which must be positioned. Returns the function that
 * removes them.
 */
export function attachChartTooltip(canvas, { draw, data, describe: explain }) {
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
    const text = hit && explain(hit);
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
// 10. Checks, printed report and command line
// ---------------------------------------------------------------------------

/** The public key of DEFAULT_KEY, computed also with the ethers 6.13.5 library. */
export const DEFAULT_PUBLIC_KEY = '03bc3c81132976acd7d48f1fb6cb420bb1e3946cb95d8fb48b597d2c0d5297572b';

/**
 * Known values the implementation must reproduce: the test vectors of
 * FIPS 180-4 for SHA-256, multiples of G published with secp256k1 and
 * recomputed with ethers 6.13.5, nG = O, and the round trips of both
 * ciphers on the message of the page.
 */
export const CHECK_VECTORS = Object.freeze([
  { group: 'sha256', name: 'SHA-256("")', input: '', expected: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' },
  { group: 'sha256', name: 'SHA-256("abc")', input: 'abc', expected: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad' },
  { group: 'curve', name: '2G', k: 2n, expected: '02c6047f9441ed7d6d3045406e95c07cd85c778e4b8cef3ca7abac09b95c709ee5' },
  { group: 'curve', name: '3G', k: 3n, expected: '02f9308a019258c31049344f85f89d5229b531c845836f99b08601f113bce036f9' },
  { group: 'curve', name: '255G', k: 255n, expected: '031b38903a43f7f114ed4500b4eac7083fdefece1cf29c63528d563446f972c180' },
  { group: 'curve', name: `${DEFAULT_KEY}G`, k: DEFAULT_KEY, expected: DEFAULT_PUBLIC_KEY },
  { group: 'curve', name: `${KEY_MAX}G`, k: KEY_MAX, expected: '02ba7e7b78e1ff713857bcc6432dcee5f7c6ca7fc8f84af479811bcabec921305e' },
]);

/** Every check, with what was expected and what came out. */
export function verifyAll() {
  const rows = CHECK_VECTORS.map((v) => {
    const actual = v.group === 'sha256' ? toHex(sha256(utf8(v.input))) : pointHex(multiplyG(v.k));
    // the multiplication by the table, and the plain double-and-add, must agree
    const ok = actual === v.expected && (v.group === 'sha256' || pointHex(multiply(G, v.k)) === v.expected);
    return { group: v.group, name: v.name, expected: v.expected, actual, ok };
  });
  const order = multiply(G, CURVE_N);
  rows.push({ group: 'curve', name: 'nG = O', expected: 'O', actual: order === null ? 'O' : pointHex(order), ok: order === null });
  const scheme = toyScheme(DEFAULT_KEY);
  const back = scheme.decrypt(scheme.encrypt(DEFAULT_MESSAGE).blocks).text;
  rows.push({ group: 'scheme', name: 'decrypt(encrypt(m)) = m', expected: DEFAULT_MESSAGE, actual: back, ok: back === DEFAULT_MESSAGE });
  const shifted = caesar(DEFAULT_MESSAGE, DEFAULT_SHIFT);
  const round = caesarDecrypt(shifted, DEFAULT_SHIFT);
  rows.push({ group: 'caesar', name: 'Caesar: decrypt(encrypt(m)) = m', expected: DEFAULT_MESSAGE, actual: round, ok: round === DEFAULT_MESSAGE });
  const sample = caesar('The quick brown fox jumps over the lazy dog.', 3);
  rows.push({ group: 'caesar', name: 'Caesar, shift 3', expected: 'Wkh txlfn eurzq ira mxpsv ryhu wkh odcb grj.', actual: sample, ok: sample === 'Wkh txlfn eurzq ira mxpsv ryhu wkh odcb grj.' });
  return rows;
}

const short = (hex, keep = 12) => (hex.length > 2 * keep + 3 ? `${hex.slice(0, keep)}...${hex.slice(-keep)}` : hex);
const printable = (b) => (b >= 32 && b < 127 ? `'${String.fromCharCode(b)}'` : '   ');

/** The toy scheme and the Caesar cipher on one input, as the program prints them. */
export function reportLines({ key = DEFAULT_KEY, message = DEFAULT_MESSAGE, shift = DEFAULT_SHIFT, nonces = 'seeded' } = {}) {
  const lines = [];
  const scheme = toyScheme(key, { nonces });
  const { bytes, blocks } = scheme.encrypt(message);
  const back = scheme.decrypt(blocks);
  lines.push(`Toy scheme: EC-ElGamal on secp256k1, private keys of at most ${KEY_BITS} bits`);
  lines.push(`  private key  k = ${key} (0x${key.toString(16)}, ${key.toString(2).length} bits)`);
  lines.push(`  public key   K = kG = ${pointHex(scheme.K)}`);
  lines.push(`  message (${bytes.length} bytes): ${message}`);
  lines.push(`  nonces: ${nonces === 'random' ? 'from the cryptographic generator' : `SHA-256("${NONCE_SEED}" || i || attempt), reproducible`}`);
  lines.push('  block  byte        r                              C1 = rG                        C2 = bG + rK');
  for (const b of blocks.slice(0, 4)) {
    lines.push(`  ${String(b.index + 1).padStart(5)}  ${String(b.byte).padStart(3)} ${printable(b.byte)}  ${short(b.r.toString(16).padStart(64, '0'))}  ${short(pointHex(b.C1))}  ${short(pointHex(b.C2))}`);
  }
  if (blocks.length > 4) lines.push(`  ... and ${blocks.length - 4} more blocks`);
  lines.push(`  ciphertext: ${66 * blocks.length} bytes, 66 per byte of message`);
  lines.push(`  decrypted with k: ${back.text === message ? 'identical to the message' : `DIFFERENT: ${back.text}`}`);
  lines.push('');
  const cipherText = caesar(message, shift);
  lines.push(`Caesar cipher, shift ${shift} (${ALPHABET[0].toUpperCase()} -> ${ALPHABET[shift].toUpperCase()}):`);
  lines.push(`  ciphertext: ${cipherText}`);
  lines.push(`  decrypted:  ${caesarDecrypt(cipherText, shift) === message ? 'identical to the message' : 'DIFFERENT'}`);
  return { lines, scheme, blocks, cipherText };
}

const DIGITS = /^\d{1,10}$/;
const fmtP = (t) => {
  if (t.pValue === 0) return '< 1e-300';
  return t.pValue < 0.001 ? t.pValue.toExponential(1) : t.pValue.toFixed(3);
};
const pct = (v) => `${(100 * v).toFixed(1)}%`;
const seconds = (ms) => (ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${ms.toFixed(0)} ms`);

/** A duration in seconds, in the largest unit that keeps it readable. */
export function humanDuration(s) {
  if (!Number.isFinite(s)) return 'forever';
  const units = [['years', 365.25 * 86400], ['days', 86400], ['hours', 3600], ['minutes', 60], ['seconds', 1]];
  for (const [name, size] of units) {
    if (s >= size) {
      const v = s / size;
      return v >= 1e6 ? `${v.toExponential(1)} ${name}` : `${v.toFixed(1)} ${name}`;
    }
  }
  return `${(s * 1000).toFixed(1)} ms`;
}

/** The names of the methods as the command line prints them. */
const METHOD_NAMES = { top: 'most frequent', chi2: 'chi-square', unigram: 'max likelihood', bigram: 'bigrams', quadgram: 'quadgrams', dictionary: 'dictionary' };

/**
 * Command line: node homework2a.js [--key k | --random-key] [--message "text"]
 * [--shift s] [--random-nonces] [--no-stats]. Options are checked
 * strictly: anything unknown or malformed prints the usage.
 */
export function runCli(argv, print = console.log) {
  const usage = () => {
    print('usage: node homework2a.js [--key k | --random-key] [--message "text"] [--shift 0-25] [--random-nonces] [--no-stats]');
    print(`       k is the private key of the toy scheme, from 1 to ${KEY_MAX}; the message has at most ${MESSAGE_MAX_BYTES} bytes.`);
    return 1;
  };
  const options = { key: DEFAULT_KEY, message: DEFAULT_MESSAGE, shift: DEFAULT_SHIFT, nonces: 'seeded', stats: true };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const value = argv[i + 1];
    if (arg === '--no-stats') options.stats = false;
    else if (arg === '--random-nonces') options.nonces = 'random';
    else if (arg === '--random-key') options.key = randomPrivateKey();
    else if (arg === '--key' && value !== undefined && DIGITS.test(value) && parsePrivateKey(value).ok) {
      options.key = parsePrivateKey(value).value;
      i++;
    } else if (arg === '--message' && value !== undefined && value !== '' && utf8(value).length <= MESSAGE_MAX_BYTES) {
      options.message = value;
      i++;
    } else if (arg === '--shift' && value !== undefined && parseShift(value).ok) {
      options.shift = parseShift(value).value;
      i++;
    } else {
      return usage();
    }
  }
  const checks = verifyAll();
  const failed = checks.filter((r) => !r.ok);
  print(`Checks: ${checks.length - failed.length} of ${checks.length} passed (SHA-256 test vectors, multiples of G, nG = O, round trips).`);
  failed.forEach((r) => print(`  FAILED ${r.name}: expected ${r.expected}, got ${r.actual}`));
  print('');
  const { lines, scheme, blocks, cipherText } = reportLines(options);
  lines.forEach((l) => print(l));
  print('');

  const smoothing = runSteps(chooseSmoothingSteps());
  const models = languageModels(smoothing.betas);
  const crack = crackCaesar(cipherText, models);
  print(`Statistical attack on the Caesar ciphertext (${crack.letters} letters; letter frequencies of chapters I-IX of Alice's Adventures in Wonderland):`);
  if (crack.key === null) print('  maximum likelihood: no single best shift');
  else print(`  maximum likelihood: shift ${crack.key}, posterior probability ${crack.posterior[crack.key].toFixed(4)}; decrypted: ${caesarDecrypt(cipherText, crack.key)}`);
  print(`  every method: ${METHODS.map((m) => `${METHOD_NAMES[m]} ${crack.methods[m].best.join('/')}`).join(', ')}`);
  print('');

  const publicKey = pointHex(scheme.K);
  print(`Attacks on the public key K = ${publicKey}:`);
  const exhaustive = runSteps(attackSteps('exhaustive', publicKey));
  const rate = (1000 * exhaustive.ops) / Math.max(1, exhaustive.ms);
  if (exhaustive.found) print(`  exhaustive search: k = ${exhaustive.key} after ${exhaustive.ops} candidates, ${seconds(exhaustive.ms)}`);
  else print(`  exhaustive search: the first ${exhaustive.limit} candidates in ${seconds(exhaustive.ms)} (${Math.round(rate)} per second), k not among them; reaching k = ${options.key} would take about ${humanDuration(Number(options.key) / rate)}`);
  const bsgs = runSteps(attackSteps('bsgs', publicKey));
  print(`  baby-step giant-step: k = ${bsgs.key} with ${bsgs.ops} group operations (${bsgs.baby} baby steps, ${bsgs.giant} giant steps), ${seconds(bsgs.ms)}`);
  const kangaroo = runSteps(attackSteps('kangaroo', publicKey));
  print(`  kangaroo: k = ${kangaroo.key} with ${kangaroo.ops} jumps of ${kangaroo.N} kangaroos (expected about ${Math.round(kangaroo.expected)}), ${kangaroo.distinguished} distinguished points, ${seconds(kangaroo.ms)}`);
  const recovered = toyScheme(BigInt(bsgs.key)).decrypt(blocks).text;
  print(`  decrypted with the recovered key: ${recovered === options.message ? 'identical to the message' : `DIFFERENT: ${recovered}`}`);
  const reused = toyScheme(options.key, { nonces: () => REUSED_NONCE }).encrypt(options.message).blocks;
  const attack = nonceReuseAttack(reused);
  if (attack && attack.candidates.length) print(`  flawed variant with one nonce for every byte, broken without k: ${attack.candidates[0].text}`);
  const augustus = scheme.decrypt(shiftCiphertext(blocks, 1));
  print(`  every C2 plus G, decrypted with k: ${augustus.ok ? augustus.text : 'not a byte sequence (a byte was 255)'}`);
  if (!options.stats) return failed.length ? 1 : 0;

  print('');
  const s = explore();
  print(`Language models (training: chapters ${SPLIT.training[0]}-${SPLIT.training[SPLIT.training.length - 1]}, ${s.corpus.training.letters} letters; test: chapters ${SPLIT.test[0]}-${SPLIT.test[SPLIT.test.length - 1]}, ${s.corpus.test.letters} letters):`);
  s.models.crossEntropy.forEach((h, i) => {
    print(`  ${i + 1}-grams: beta = ${s.models.betas[i]}, cross-entropy on the test chapters ${h.toFixed(3)} bits per letter, redundancy ${s.models.redundancy[i].toFixed(3)}, unicity distance ${s.models.unicity[i].toFixed(1)} letters`);
  });
  print('');
  print(`Caesar experiment: disjoint passages of the test chapters under random shifts, success rate of every method (seed ${EXPLORE_SEED}):`);
  print(`  ${'letters'.padStart(7)} ${'trials'.padStart(6)}  ${METHODS.map((m) => METHOD_NAMES[m].padStart(14)).join(' ')}  ${'bound'.padStart(7)}`);
  s.caesar.lengths.forEach((L, i) => {
    print(`  ${String(L).padStart(7)} ${String(s.caesar.trials[i]).padStart(6)}  ${METHODS.map((m) => pct(s.caesar.rates[m][i]).padStart(14)).join(' ')}  ${pct(s.caesar.bound[i]).padStart(7)}`);
  });
  print('  (bound: Chernoff lower bound for maximum likelihood with independent letters)');
  print('');
  const all = Object.entries(statisticalTests(s)).flatMap(([group, list]) => list.map(([k, test]) => ({ group, key: k, test })));
  print(`Hypothesis tests, alpha = ${SIGNIFICANCE}:`);
  for (const { group, key: k, test } of all) print(`  ${group.padEnd(7)} ${fmtP(test).padEnd(8)} ${test.verdict === 'reject' ? '[rejected] ' : ''}${TEST_LABELS[group][k]}`);
  print('');
  const sc = scaling();
  print(`Cost of the attacks against the key size (mean group operations, keys from seed ${sc.seed}):`);
  for (const [method, list] of Object.entries(sc.rows)) {
    const fit = sc.fits[method];
    print(`  ${method.padEnd(10)} ${list.map((r) => `${r.bits} bits: ${Math.round(r.mean)}`).join(', ')}`);
    print(`             fitted exponent ${fit.slope.toFixed(3)} +- ${fit.slopeError.toFixed(3)} (theory ${fit.exponent}); with the theory's exponent, 256 bits: about 2^${(fit.constant + fit.exponent * 256).toFixed(1)} operations`);
  }
  print(`  this machine: ${Math.round(sc.rate)} group operations per second; 2^128 of them would take ${humanDuration(2 ** 128 / sc.rate)}`);
  return failed.length ? 1 : 0;
}

/** True under Node, where the downloadable program can run runCli. */
export const isNode = typeof process !== 'undefined' && !!(process.versions && process.versions.node);

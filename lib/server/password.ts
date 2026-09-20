const DEFAULT_ITERATIONS = 210_000;

function toHex(bytes: Uint8Array) {
  return Array.from(bytes).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function fromHex(value: string) {
  if (!/^[0-9a-f]+$/i.test(value) || value.length % 2 !== 0) return new Uint8Array();
  const bytes = new Uint8Array(value.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = parseInt(value.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

async function derive(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: new Uint8Array(salt).buffer,
      iterations,
    },
    key,
    256
  );

  return new Uint8Array(bits);
}

export function validatePassword(password: string) {
  if (password.length < 8) return "PASSWORD_TOO_SHORT";
  if (password.length > 128) return "PASSWORD_TOO_LONG";
  return null;
}

export async function hashPassword(password: string) {
  const error = validatePassword(password);
  if (error) throw new Error(error);

  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const hash = await derive(password, salt, DEFAULT_ITERATIONS);

  return {
    hash: toHex(hash),
    salt: toHex(salt),
    iterations: DEFAULT_ITERATIONS,
  };
}

export async function verifyPassword(
  password: string,
  storedHash: string,
  storedSalt: string,
  iterations: number
) {
  if (!storedHash || !storedSalt || !iterations) return false;

  const salt = fromHex(storedSalt);
  if (!salt.length) return false;

  const derived = await derive(password, salt, iterations);
  const expected = fromHex(storedHash);
  if (derived.length !== expected.length) return false;

  let diff = 0;
  for (let i = 0; i < derived.length; i += 1) diff |= derived[i] ^ expected[i];
  return diff === 0;
}

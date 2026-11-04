const PREFIX = "client-pbkdf2-v1$";

function isHex(value: string) {
  return /^[0-9a-f]{64}$/i.test(value);
}

function equal(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

async function mac(pepper: string, verifier: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(pepper), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("khonenama:password-verifier:v1:" + verifier.toLowerCase()));
  return Array.from(new Uint8Array(signed)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function pepper(env: any) {
  const value = String(env?.PASSWORD_VERIFIER_PEPPER || "");
  if (value.length < 32) throw new Error("PASSWORD_VERIFIER_NOT_CONFIGURED");
  return value;
}

export function isClientPasswordHash(value: string) {
  return value.startsWith(PREFIX) && isHex(value.slice(PREFIX.length));
}

export function validateClientPasswordCredential(verifier: unknown, salt: unknown, iterations: unknown) {
  return typeof verifier === "string" && isHex(verifier) && typeof salt === "string" && /^[0-9a-f]{32}$/i.test(salt) && Number(iterations) === 600_000;
}

export async function storeClientPasswordHash(env: any, verifier: string) {
  return PREFIX + await mac(pepper(env), verifier);
}

export async function verifyClientPasswordHash(env: any, verifier: string, stored: string) {
  if (!isHex(verifier) || !isClientPasswordHash(stored)) return false;
  return equal(await storeClientPasswordHash(env, verifier), stored);
}

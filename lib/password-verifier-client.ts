// This work intentionally happens in the browser. A 600k PBKDF2 run exceeds
// the 10ms CPU allowance of a Workers Free request, but is appropriate for a
// person's device during sign-up or login.
export const CLIENT_PASSWORD_ITERATIONS = 600_000;

function hex(bytes: Uint8Array) {
  return Array.from(bytes).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function fromHex(value: string) {
  if (!/^[0-9a-f]{32}$/i.test(value)) throw new Error("INVALID_PASSWORD_SALT");
  return new Uint8Array(value.match(/.{2}/g)!.map((part) => Number.parseInt(part, 16)));
}

function normalizePhone(value: string) {
  return value.replace(/[۰-۹]/g, (char) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(char)))
    .replace(/[٠-٩]/g, (char) => String("٠١٢٣٤٥٦٧٨٩".indexOf(char)))
    .replace(/[^\d+]/g, "")
    .replace(/^\+98/, "0")
    .replace(/^98(?=\d{10}$)/, "0");
}

export async function passwordSaltForPhone(phone: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("khonenama:password-salt:v1:" + normalizePhone(phone)));
  return hex(new Uint8Array(digest).slice(0, 16));
}

export async function derivePasswordVerifier(password: string, salt: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: fromHex(salt), iterations: CLIENT_PASSWORD_ITERATIONS },
    key,
    256
  );
  return hex(new Uint8Array(bits));
}

export async function createPasswordVerifier(password: string, phone: string) {
  const passwordSalt = await passwordSaltForPhone(phone);
  return {
    passwordSalt,
    passwordVerifier: await derivePasswordVerifier(password, passwordSalt),
    passwordIterations: CLIENT_PASSWORD_ITERATIONS,
  };
}

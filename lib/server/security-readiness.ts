// Return names and state only. Never include values, lengths or credential hashes.
export function securityReadiness(settings: Record<string, unknown>) {
  const state = (name: string, required: boolean, valid = (value: string) => value.trim().length >= 32) => {
    const value = settings[name];
    const present = typeof value === "string" && value.length > 0;
    return { name, required, status: present ? valid(value as string) ? "configured" : "invalid" : required ? "missing" : "optional_unconfigured" };
  };
  const sms = settings.SMS_ROLE === "panel";
  const checks = [state("ADMIN_ACCESS_KEY",true), state("SMS_INTERNAL_TOKEN",true)];
  if (sms) checks.push(state("SMS_BRIDGE_TOKEN",true),state("SMS_ADMIN_ACCESS_KEY",false));
  checks.push(state("ADMIN_LOGIN_PASSWORD_HASH",false,value => /^pbkdf2-sha256\$100000\$[a-f0-9]{32}\$[a-f0-9]{64}$/.test(value)));
  return { ready: checks.every(check => ["configured", "optional_unconfigured"].includes(check.status)), role: sms ? "sms" : "site", checks };
}

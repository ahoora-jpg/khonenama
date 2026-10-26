export function liveSmsEnabled(settings: { SMS_LIVE_SEND_ENABLED?: unknown }): boolean {
  return settings.SMS_LIVE_SEND_ENABLED === "true";
}

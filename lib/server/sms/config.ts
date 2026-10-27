export function liveSmsEnabled(settings: { SMS_LIVE_SEND_ENABLED?: unknown }): boolean {
  return settings.SMS_LIVE_SEND_ENABLED === "true";
}
export function smsSimSelection(settings: { SMS_SIM_MODE?: unknown }): 2 | "default" | null {
  if(settings.SMS_SIM_MODE === "default")return "default";
  if(settings.SMS_SIM_MODE === undefined || settings.SMS_SIM_MODE === "2")return 2;
  return null;
}

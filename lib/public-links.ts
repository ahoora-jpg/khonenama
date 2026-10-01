export function safeWebsiteUrl(value: string): string {
  const input = value.trim();
  if (!input || /[\u0000-\u0020\u007f]/.test(input)) return "";
  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(input) ? input : "https://" + input);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return "";
    return url.href;
  } catch { return ""; }
}

export function safeInstagramUrl(value: string): string {
  const input = value.trim();
  if (/^@?[a-z\d._]{1,30}$/i.test(input)) return "https://www.instagram.com/" + input.replace(/^@/, "");
  const safe = safeWebsiteUrl(input);
  if (!safe) return "";
  const url = new URL(safe);
  return ["instagram.com", "www.instagram.com"].includes(url.hostname) ? url.href : "";
}

/** Serialize structured data inside a script element without allowing HTML termination. */
export function safeJsonLd(value: unknown): string {
  const escaped: Record<string, string> = { '<': '\\u003c', '>': '\\u003e', '&': '\\u0026', '\u2028': '\\u2028', '\u2029': '\\u2029' };
  return (JSON.stringify(value) ?? 'null').replace(/[<>&\u2028\u2029]/g, char => escaped[char]);
}

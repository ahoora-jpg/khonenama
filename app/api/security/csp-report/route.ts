const KNOWN_DIRECTIVES = new Set([
  "base-uri", "child-src", "connect-src", "default-src", "font-src",
  "form-action", "frame-ancestors", "frame-src", "img-src", "media-src",
  "object-src", "script-src", "style-src", "worker-src",
]);

type CspReport = { "effective-directive"?: unknown; disposition?: unknown };

function reportsFrom(payload: unknown): CspReport[] {
  if (Array.isArray(payload)) return payload.filter((item): item is CspReport => Boolean(item) && typeof item === "object");
  if (payload && typeof payload === "object") {
    const report = (payload as { "csp-report"?: unknown })["csp-report"];
    return report && typeof report === "object" ? [report as CspReport] : [payload as CspReport];
  }
  return [];
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return new Response(null, { status: 204 });
  }

  for (const report of reportsFrom(payload).slice(0, 5)) {
    const directive = typeof report["effective-directive"] === "string" && KNOWN_DIRECTIVES.has(report["effective-directive"])
      ? report["effective-directive"]
      : "unknown";
    const disposition = report.disposition === "enforce" ? "enforce" : "report";
    // Do not retain document, referrer, or blocked-resource URLs: they can
    // contain personal information. The two aggregate fields aid triage.
    console.warn("CSP_VIOLATION", { directive, disposition });
  }

  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}

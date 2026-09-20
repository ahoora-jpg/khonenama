import { env } from "cloudflare:workers";
import { hashPassword } from "@/lib/server/password";

export async function GET() {
  const db = (env as any).DB;
  if (!db) {
    return Response.json({ ok: false, error: "D1_UNBOUND" }, { status: 503 });
  }

  try {
    const [userColumnsResult, businessColumnsResult] = await Promise.all([
      db.prepare("PRAGMA table_info(users)").all(),
      db.prepare("PRAGMA table_info(businesses)").all(),
    ]);

    const userColumns = new Set(
      (userColumnsResult?.results || []).map((row: any) => String(row.name))
    );
    const businessColumns = new Set(
      (businessColumnsResult?.results || []).map((row: any) => String(row.name))
    );

    let passwordCrypto = { ok: false, errorName: "", errorMessage: "" };
    const started = Date.now();
    try {
      const result = await hashPassword("Khonenama-Test-1234");
      passwordCrypto = {
        ok: Boolean(result.hash && result.salt && result.iterations),
        errorName: "",
        errorMessage: "",
      };
    } catch (error) {
      passwordCrypto = {
        ok: false,
        errorName: error instanceof Error ? error.name : "UnknownError",
        errorMessage: error instanceof Error ? error.message.slice(0, 180) : String(error).slice(0, 180),
      };
    }

    return Response.json(
      {
        ok: true,
        schema: {
          users: {
            password_hash: userColumns.has("password_hash"),
            password_salt: userColumns.has("password_salt"),
            password_iterations: userColumns.has("password_iterations"),
            password_set_at: userColumns.has("password_set_at"),
          },
          businesses: {
            business_type: businessColumns.has("business_type"),
          },
        },
        passwordCrypto,
        elapsedMs: Date.now() - started,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message.slice(0, 200) : String(error).slice(0, 200),
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

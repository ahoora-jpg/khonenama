import { env } from "cloudflare:workers";
import { isAdminRequest } from "@/lib/server/admin-session";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest(request))) {
    return Response.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await params;
  const businessId = Number(id);
  if (!Number.isInteger(businessId) || businessId < 1) {
    return Response.json({ ok: false, error: "INVALID_ID" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const action = body?.action === "approve" ? "approve" : body?.action === "reject" ? "reject" : "";
  const note = typeof body?.note === "string" ? body.note.trim().slice(0, 1000) : "";

  if (!action) {
    return Response.json({ ok: false, error: "INVALID_ACTION" }, { status: 400 });
  }

  const db = (env as any).DB;
  const business = await db.prepare("SELECT id, status FROM businesses WHERE id = ? LIMIT 1").bind(businessId).first();
  if (!business?.id) {
    return Response.json({ ok: false, error: "BUSINESS_NOT_FOUND" }, { status: 404 });
  }

  const requestRow = await db
    .prepare(
      "SELECT id FROM verification_requests WHERE business_id = ? AND kind = 'business' ORDER BY id DESC LIMIT 1"
    )
    .bind(businessId)
    .first();

  if (action === "approve") {
    await db.batch([
      db
        .prepare("UPDATE businesses SET status = 'published', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(businessId),
      requestRow?.id
        ? db
            .prepare("UPDATE verification_requests SET status = 'approved', reviewer_note = NULLIF(?, ''), reviewed_at = CURRENT_TIMESTAMP WHERE id = ?")
            .bind(note, requestRow.id)
        : db
            .prepare("SELECT 1"),
    ]);
    return Response.json({ ok: true, status: "published" });
  }

  await db.batch([
    db
      .prepare("UPDATE businesses SET status = 'draft', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .bind(businessId),
    requestRow?.id
      ? db
          .prepare("UPDATE verification_requests SET status = 'rejected', reviewer_note = NULLIF(?, ''), reviewed_at = CURRENT_TIMESTAMP WHERE id = ?")
          .bind(note, requestRow.id)
      : db
          .prepare("SELECT 1"),
  ]);

  return Response.json({ ok: true, status: "draft" });
}

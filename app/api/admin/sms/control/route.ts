import { env } from 'cloudflare:workers';
import { isSmsAdminRequest } from '@/lib/server/sms/admin-auth';
import { dispatchControl, setDispatchPaused } from '@/lib/server/sms/dispatch-control';
import { TENANT, noStore } from '@/lib/server/sms/domain';
import { previewRetry, commitRetry } from '@/lib/server/sms/retry';
import { crossSiteMutation } from '@/lib/request-security';

export async function GET(request: Request) {
  if (!await isSmsAdminRequest(request)) return noStore({ ok: false }, 401);
  try { return noStore({ ok: true, control: await dispatchControl((env as any).DB) }); }
  catch { return noStore({ ok: false, error: 'CONTROL_UNAVAILABLE' }, 503); }
}
export async function POST(request: Request) {
  if (crossSiteMutation(request)) return noStore({ ok: false }, 403);
  if (!await isSmsAdminRequest(request)) return noStore({ ok: false }, 401);
  if (Number(request.headers.get('content-length') || 0) > 16000) return noStore({ ok: false }, 413);
  const reader = request.body?.getReader(), chunks: Uint8Array[] = []; let bytes = 0;
  try {
    if (reader) while (true) {
      const part = await reader.read(); if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > 16000) { await reader.cancel(); return noStore({ ok: false }, 413); }
      chunks.push(part.value);
    }
  } catch { return noStore({ ok: false }, 400); }
  const buffer = new Uint8Array(bytes); let offset = 0;
  for (const chunk of chunks) { buffer.set(chunk, offset); offset += chunk.length; }
  const text = new TextDecoder().decode(buffer);
  let input: any; try { input = JSON.parse(text); } catch { return noStore({ ok: false }, 400); }
  if (!input || typeof input !== 'object') return noStore({ ok: false }, 400);
  const db = (env as any).DB;
  try {
    if (input.action === 'pauseAll' || input.action === 'resumeAll')
      return noStore({ ok: true, control: await setDispatchPaused(db, input.action === 'pauseAll') });
    if (!['previewRetry', 'retry'].includes(input.action)) return noStore({ ok: false }, 400);
    const scheduledAt = input.scheduledAt;
    if (typeof scheduledAt !== 'string' || !Number.isFinite(Date.parse(scheduledAt)) || Date.parse(scheduledAt) < Date.now() - 60000 || Date.parse(scheduledAt) > Date.now() + 31 * 86400000)
      return noStore({ ok: false, error: 'INVALID_SCHEDULE' }, 400);
    let ids = input.ids;
    let nextCursor: string | null = null, total: number | undefined;
    if (input.action === 'previewRetry' && typeof input.campaignId === 'string') {
      const cursor = String(input.cursor || '').slice(0, 120);
      const rows = await db.prepare(`SELECT id FROM sms_messages WHERE tenant_id=? AND campaign_id=? AND status='failed' AND id>? ORDER BY id LIMIT 51`).bind(TENANT, input.campaignId.slice(0, 120), cursor).all();
      ids = rows.results.slice(0, 50).map((r: any) => r.id);
      nextCursor = rows.results.length > 50 ? ids[49] : null;
      total = (await db.prepare("SELECT COUNT(*) n FROM sms_messages WHERE tenant_id=? AND campaign_id=? AND status='failed'").bind(TENANT, input.campaignId).first()).n;
    }
    if (!Array.isArray(ids) || ids.length > 50 || ids.some(id => typeof id !== 'string' || !/^[a-zA-Z0-9:_-]{1,120}$/.test(id))) return noStore({ ok: false, error: 'RETRY_BATCH_LIMIT' }, 400);
    ids = Array.from(new Set<string>(ids)).sort();
    if (!ids.length) return noStore({ ok: true, ids: [], eligible: 0, skipped: 0, nextCursor, total });
    if (input.action === 'previewRetry') return noStore({ ok: true, ...await previewRetry(db, ids, scheduledAt), requestedIds: ids, nextCursor, total });
    if (input.confirmed !== true || typeof input.token !== 'string') return noStore({ ok: false, error: 'CONFIRMATION_REQUIRED' }, 400);
    return noStore({ ok: true, ...await commitRetry(db, ids, scheduledAt, input.token) });
  } catch (error) {
    const changed = (error as Error).message === 'RETRY_PREVIEW_CHANGED';
    return noStore({ ok: false, error: changed ? 'RETRY_PREVIEW_CHANGED' : 'CONTROL_UNAVAILABLE' }, changed ? 409 : 503);
  }
}

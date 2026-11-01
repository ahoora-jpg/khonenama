"use client";
import Link from 'next/link';
import { useRef, useState } from 'react';
import { Badge, Field, Modal, Panel, StatCard, smsApi, useSms } from './SmsAdminShell';
import { bridgeState, faNumber, smsDate } from '@/lib/sms-admin-ui';

export function RetryAction({ ids, campaignId, onDone, children = 'تلاش مجدد' }: { ids?: string[]; campaignId?: string; onDone?: () => void; children?: React.ReactNode }) {
  const { notify, refresh } = useSms();
  const [preview, setPreview] = useState<any>(null), [busy, setBusy] = useState(false);
  const [schedule, setSchedule] = useState('');
  const lock = useRef(false);
  async function inspect(cursor?: string) {
    if (lock.current) return; lock.current = true; setBusy(true);
    try {
      const scheduledAt = schedule ? new Date(schedule).toISOString() : new Date(Date.now() + 60000).toISOString();
      const value = await smsApi('/api/admin/sms/control', { action: 'previewRetry', ids, campaignId, cursor, scheduledAt });
      setPreview({ ...value, scheduledAt });
    } catch (e) { notify((e as Error).message); } finally { lock.current = false; setBusy(false); }
  }
  return <>
    <button className="sms-secondary" disabled={busy || (ids && !ids.length)} onClick={() => void inspect()}>{children}</button>
    {preview && <Modal title="بازبینی تلاش مجدد" onClose={() => setPreview(null)}>
      <p>{faNumber(preview.eligible)} پیام واجد شرایط‌اند؛ {faNumber(preview.skipped)} مورد به علت وضعیت، لغو دریافت، سابقهٔ تلاش مجدد یا شرایط مخاطب کنار گذاشته می‌شوند.</p>
      <p>هر نوبت حداکثر ۵۰ پیام بررسی می‌شود. تاریخچهٔ پیام اصلی حفظ خواهد شد.</p><p>اگر ارسال سراسری یا کمپین متوقف باشد، تلاش مجدد نیز تا ادامهٔ آن در صف می‌ماند.</p>
      <p>زمان ثبت در صف: {smsDate(preview.scheduledAt)}</p>
      <Field label="زمان دیگر (اختیاری؛ سپس بازبینی را بزنید)"><input type="datetime-local" value={schedule} onChange={e => setSchedule(e.target.value)} /></Field>
      <div className="sms-modal-actions">
        <button className="sms-secondary" disabled={busy} onClick={() => void inspect()}>بازبینی زمان</button>
        <button disabled={busy || !preview.eligible} onClick={async () => {
          if (lock.current) return; lock.current = true; setBusy(true);
          try {
            const result = await smsApi('/api/admin/sms/control', { action: 'retry', ids: preview.requestedIds, scheduledAt: preview.scheduledAt, token: preview.token, confirmed: true });
            notify(`${faNumber(result.created)} پیام تازه در صف ثبت شد؛ تحویل هنوز تأیید نشده است.`);
            if (preview.nextCursor) setPreview({ ...preview, eligible: 0, committed: true }); else setPreview(null);
            onDone?.(); await refresh();
          } catch (e) { notify((e as Error).message); } finally { lock.current = false; setBusy(false); }
        }}>تأیید و ثبت تلاش مجدد</button>
        {preview.nextCursor && <button disabled={busy} className="sms-secondary" onClick={() => void inspect(preview.nextCursor)}>بازبینی دستهٔ بعدی</button>}
      </div>
    </Modal>}
  </>;
}

export function CampaignControls({ campaign }: { campaign: { id: string; name: string; status: string } }) {
  const { data, refresh, notify } = useSms(); const [busy, setBusy] = useState(false);
  async function act(action: string) {
    if (busy) return;
    const description = action === 'cancel' ? 'کمپین و پیام‌های باقی‌ماندهٔ آن لغو شوند؟' : action === 'pause'
      ? 'توقف کمپین مانع برداشت پیام‌های بعدی این کمپین از صف می‌شود؛ پیام در حال پردازش ممکن است نتیجه نهایی خود را ثبت کند.'
      : 'کمپین از همان صف ادامه یابد؟ پیام‌های منقضی بدون زمان‌بندی تازه ارسال نمی‌شوند.';
    if (!window.confirm(description)) return;
    setBusy(true); try { await smsApi('/api/admin/sms/campaigns', { action, id: campaign.id }); await refresh(); notify('وضعیت کمپین ذخیره شد.'); }
    catch (e) { notify((e as Error).message); } finally { setBusy(false); }
  }
  return <div className="sms-command-actions">
    {['approved', 'running'].includes(campaign.status) && <button disabled={busy} onClick={() => void act('pause')}>توقف کمپین</button>}
    {campaign.status === 'paused' && <button disabled={busy || !data.liveSendingEnabled} onClick={() => void act('resume')}>ادامه کمپین</button>}
    {['draft', 'approved', 'running', 'paused'].includes(campaign.status) && <button className="sms-danger" disabled={busy} onClick={() => void act('cancel')}>لغو کمپین</button>}
    <Link className="sms-button sms-secondary" href={'/sms/campaigns?campaign_id=' + campaign.id}>مشاهده جزئیات</Link>
  </div>;
}

export function CommandDashboard() {
  const { data, refresh, notify } = useSms(); const [busy, setBusy] = useState(false);
  const paused = Boolean(data.control?.paused), state = bridgeState(data.agent);
  const phoneRecent = data.agent?.last_inbox_at && Date.now() - Date.parse(data.agent.last_inbox_at.replace(' ', 'T') + (/Z|[+]\d\d:\d\d$/.test(data.agent.last_inbox_at) ? '' : 'Z')) < 300000;
  const counts = Object.fromEntries(data.counts.map(v => [v.status, v.count]));
  const active = data.campaigns.filter(c => ['approved', 'running', 'paused'].includes(c.status));
  return <>
    <section className={'sms-command-banner ' + (paused ? 'is-paused' : '')} aria-label="کنترل ارسال">
      <div><h2>{paused ? 'همه ارسال‌ها متوقف است' : data.liveSendingEnabled ? 'ارسال فعال است' : 'ارسال واقعی غیرفعال است'}</h2>
        <p>{state === 'online' && phoneRecent ? 'گوشی متصل' : state === 'offline' ? 'ارتباط قطع' : 'نیازمند بررسی'} · آخرین ارتباط: {smsDate(data.agent?.last_seen_at)}</p>
        {paused && <p>ارسال متوقف است؛ پیام‌های موجود در صف حذف نشده‌اند و پس از ادامه ارسال پردازش می‌شوند.</p>}
      </div>
      <button disabled={busy} className={paused ? '' : 'sms-danger'} onClick={async () => {
        if (busy || !window.confirm(paused ? 'ارسال از صف موجود ادامه یابد؟' : 'برداشت پیام جدید و تولید صف کمپین‌ها متوقف شود؟ نتیجهٔ پیام‌های قبلی همچنان ثبت می‌شود.')) return;
        setBusy(true); try { await smsApi('/api/admin/sms/control', { action: paused ? 'resumeAll' : 'pauseAll' }); await refresh(); }
        catch (e) { notify((e as Error).message); } finally { setBusy(false); }
      }}>{paused ? 'ادامه همه ارسال‌ها' : 'توقف همه ارسال‌ها'}</button>
    </section>
    <div className="sms-stats sms-four-stats">
      <StatCard title="در صف" value={counts.queued || 0} href="/sms/messages?tab=history&status=queued" />
      <StatCard title="تحویل‌شده" value={counts.delivered || 0} href="/sms/messages?tab=history&status=delivered" />
      <StatCard title="ناموفق" value={counts.failed || 0} href="/sms/messages?tab=failed" />
      <StatCard title="مخاطبان" value={data.summary.contact_count ?? data.summary.consented_contacts} href="/sms/contacts" />
    </div>
    {active.length ? active.map(c => <Panel key={c.id} title={c.name}>
      <Badge state={c.status} /> <p>شروع: {smsDate(c.scheduled_at)}</p>
      <div className="sms-campaign-numbers"><span>مخاطبان: {faNumber(c.audience || 0)}</span><span>کل پیام‌ها: {faNumber(c.total || 0)}</span><span>در صف: {faNumber(c.queued || 0)}</span><span>تحویل‌شده: {faNumber(c.delivered || 0)}</span><span>در حال ارسال: {faNumber(c.sending || 0)}</span><span>ناموفق: {faNumber(c.failed || 0)}</span></div>
      <progress aria-label={'پیشرفت ' + c.name} max={Math.max(c.total || 0, 1)} value={(c.delivered || 0) + (c.failed || 0)} />
      <p className="sms-muted">پیشرفت بر اساس نتیجهٔ قطعی؛ ارسال‌شده به معنی تحویل نیست.</p><CampaignControls campaign={c} />
    </Panel>) : <Panel title="کمپین فعال"><p>هنوز کمپینی ندارید که در حال اجرا یا آمادهٔ ادامه باشد.</p></Panel>}
    <Panel title="نیازمند اقدام">
      {counts.failed > 0 && <p>{faNumber(counts.failed)} پیام ناموفق نیاز به بررسی دارند. <Link className="sms-button sms-secondary" href="/sms/messages?tab=failed">بررسی پیام‌های ناموفق</Link></p>}
      {(state !== 'online' || !phoneRecent) && <p>وضعیت اتصال نیازمند بررسی است. <Link className="sms-button sms-secondary" href="/sms/gateway">بررسی اتصال</Link></p>}
      {!counts.failed && state === 'online' && phoneRecent && <p>مورد نیازمند اقدام وجود ندارد.</p>}
    </Panel>
    <div className="sms-quick-actions"><Link href="/sms/campaigns?new=1">کمپین جدید</Link><Link href="/sms/messages?tab=send">ارسال یک پیام</Link><Link href="/sms/contacts?import=1">ورود شماره‌ها از فایل</Link></div>
  </>;
}

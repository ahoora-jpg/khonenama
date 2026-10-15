import {deleteStoredBusinessImage} from "./business-media-storage";
export async function ensureMediaRetention(db:any){
 await db.batch([
  db.prepare("CREATE TABLE IF NOT EXISTS media_retention_policy(id INTEGER PRIMARY KEY CHECK(id=1),introduced_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
  db.prepare("INSERT OR IGNORE INTO media_retention_policy(id) VALUES(1)"),
  db.prepare("CREATE TABLE IF NOT EXISTS media_retention_deletions(media_id INTEGER PRIMARY KEY,business_id INTEGER NOT NULL,provider TEXT NOT NULL,file_id TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
 ]);
}
// Legacy expired subscriptions get a full grace period from policy introduction.
export const retentionDeadlineSql="datetime(MAX(COALESCE((SELECT MAX(datetime(s.ends_at)) FROM subscriptions s JOIN plans p ON p.id=s.plan_id WHERE s.business_id=b.id AND p.code IN ('pro','premium') AND s.ends_at IS NOT NULL),(SELECT introduced_at FROM media_retention_policy WHERE id=1)),(SELECT introduced_at FROM media_retention_policy WHERE id=1)),'+30 days')";
const expiredPaid="EXISTS(SELECT 1 FROM subscriptions s JOIN plans p ON p.id=s.plan_id WHERE s.business_id=b.id AND p.code IN ('pro','premium') AND s.ends_at IS NOT NULL AND julianday(s.ends_at)<=julianday('now'))";
const noCurrentPaid="NOT EXISTS(SELECT 1 FROM subscriptions s JOIN plans p ON p.id=s.plan_id WHERE s.business_id=b.id AND p.code IN ('pro','premium') AND s.status='active' AND (s.ends_at IS NULL OR julianday(s.ends_at)>julianday('now')))";
export async function mediaRetentionStatus(db:any,businessId:number){
 await ensureMediaRetention(db);
 const row=await db.prepare("SELECT "+retentionDeadlineSql+" deadline FROM businesses b WHERE b.id=? AND "+expiredPaid+" AND "+noCurrentPaid).bind(businessId).first();
 return {retentionEndsAt:row?.deadline?String(row.deadline).replace(' ','T')+'Z':null,retentionDays:30};
}
export async function cleanExpiredMedia(db:any){
 await ensureMediaRetention(db);
 const eligible="m.provider IN ('r2','imagekit') AND "+expiredPaid+" AND "+noCurrentPaid+" AND julianday('now')>=julianday("+retentionDeadlineSql+") AND (m.media_type='video' OR (m.kind='image' AND m.media_type='image' AND m.id NOT IN (SELECT keep.id FROM business_media keep WHERE keep.business_id=b.id AND keep.kind='image' AND keep.media_type='image' ORDER BY keep.id LIMIT 10)))";
 const candidates=(await db.prepare("SELECT m.id FROM business_media m JOIN businesses b ON b.id=m.business_id WHERE "+eligible+" ORDER BY m.id LIMIT 50").all()).results||[];
 for(const row of candidates){
  // Recheck entitlement inside the same transaction that detaches media. A renewal
  // committed before this transaction protects all of the owner's files.
  await db.batch([
   db.prepare("INSERT OR IGNORE INTO media_retention_deletions(media_id,business_id,provider,file_id) SELECT m.id,m.business_id,m.provider,CASE WHEN m.provider='r2' THEN m.storage_key ELSE m.provider_file_id END FROM business_media m JOIN businesses b ON b.id=m.business_id WHERE m.id=? AND COALESCE(CASE WHEN m.provider='r2' THEN m.storage_key ELSE m.provider_file_id END,'')<>'' AND "+eligible).bind(row.id),
   db.prepare("DELETE FROM business_media WHERE id=? AND EXISTS(SELECT 1 FROM media_retention_deletions WHERE media_id=?)").bind(row.id,row.id),
  ]);
 }
 const pending=(await db.prepare("SELECT * FROM media_retention_deletions ORDER BY media_id LIMIT 50").all()).results||[];
 for(const row of pending){try{await deleteStoredBusinessImage(row.provider,row.file_id);await db.prepare("DELETE FROM media_retention_deletions WHERE media_id=?").bind(row.media_id).run();}catch{console.warn('MEDIA_RETENTION_STORAGE_RETRY');}}
 return {detached:candidates.length,pending:pending.length};
}

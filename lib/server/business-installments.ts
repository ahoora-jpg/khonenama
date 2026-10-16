export async function ensureInstallmentOptions(db:any){await db.prepare("CREATE TABLE IF NOT EXISTS business_installment_options(business_id INTEGER PRIMARY KEY REFERENCES businesses(id) ON DELETE CASCADE,show_installments INTEGER NOT NULL DEFAULT 0 CHECK(show_installments IN (0,1)),updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)").run();}
export async function setInstallmentOption(db:any,businessId:number,enabled:boolean){
 if(typeof enabled!=='boolean')throw Error('INVALID_INSTALLMENT_OPTION');
 await ensureInstallmentOptions(db);
 await db.prepare("INSERT INTO business_installment_options(business_id,show_installments) VALUES(?,?) ON CONFLICT(business_id) DO UPDATE SET show_installments=excluded.show_installments,updated_at=CURRENT_TIMESTAMP").bind(businessId,enabled?1:0).run();
}
export async function installmentBusinessIds(db:any,ids:number[]):Promise<Set<number>>{
 if(!ids.length)return new Set();
 try{const rows=await db.prepare("SELECT business_id FROM business_installment_options WHERE show_installments=1 AND business_id IN ("+ids.map(()=>'?').join(',')+")").bind(...ids).all();return new Set((rows.results||[]).map((r:any)=>Number(r.business_id)));}catch(error){if(String(error).includes('no such table'))return new Set();throw error;}
}

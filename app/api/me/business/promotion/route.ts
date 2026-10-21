import { getOwnedBusiness } from "@/lib/server/business-media";
import { promotionLink, promotionSubscription, storyTemplateCount } from "@/lib/server/business-promotion";
import { allowedStoryTemplates } from "@/lib/story-templates";
import { storySettings,ensureStoryErrors } from "@/lib/server/story-settings";

export async function GET(request: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  const owned = await getOwnedBusiness(request);
  if (!owned) return Response.json({ok:false,error:"UNAUTHENTICATED"},{status:401,headers});
  const subscription = await promotionSubscription(owned.db,owned.business.id);
  const templates = storyTemplateCount(subscription?.code);
  if (!templates) return Response.json({ok:false,error:"PAID_PLAN_REQUIRED"},{status:403,headers});
  const url = await promotionLink(owned.db,owned.business.id,subscription);
  if (!url) return Response.json({ok:false,error:"PROMOTION_EXPIRED"},{status:403,headers});
  const query=new URL(request.url).searchParams;
  const availableTemplates=allowedStoryTemplates(subscription.code,await storySettings(owned.db));
  const templateId=query.has("template")?Number(query.get("template")):null;
  if(templateId!==null&&!availableTemplates.some(t=>t.id===templateId))return Response.json({ok:false,error:"TEMPLATE_NOT_ALLOWED"},{status:403,headers});
  let selectedImage=null;
  if(query.has("image")){
    const id=Number(query.get("image"));
    if(!Number.isSafeInteger(id)||id<1)return Response.json({ok:false,error:"INVALID_IMAGE"},{status:400,headers});
    selectedImage=await owned.db.prepare("SELECT id,file_url FROM business_media WHERE id=? AND business_id=? AND media_type!='video'").bind(id,owned.business.id).first();
    if(!selectedImage?.file_url)return Response.json({ok:false,error:"IMAGE_NOT_OWNED"},{status:403,headers});
  }
  const supportValue=query.get("supporting")||"";
  const supportIds=supportValue?Array.from(new Set(supportValue.split(",").map(Number))):[];
  if(supportIds.length>3||supportIds.some(id=>!Number.isSafeInteger(id)||id<1))return Response.json({ok:false,error:"INVALID_IMAGE"},{status:400,headers});
  const supportingImages=[];
  for(const id of supportIds){
    const item=await owned.db.prepare("SELECT id,file_url FROM business_media WHERE id=? AND business_id=? AND media_type!='video' AND kind!='logo'").bind(id,owned.business.id).first();
    if(!item?.file_url)return Response.json({ok:false,error:"IMAGE_NOT_OWNED"},{status:403,headers});
    supportingImages.push(item);
  }
  const services=await owned.db.prepare("SELECT s.id,s.name FROM services s JOIN business_services bs ON bs.service_id=s.id WHERE bs.business_id=? ORDER BY s.id").bind(owned.business.id).all();
  const details = await owned.db.prepare("SELECT b.city,b.area,b.phone,b.instagram,b.description,c.name AS category FROM businesses b LEFT JOIN business_categories bc ON bc.business_id=b.id AND bc.is_primary=1 LEFT JOIN categories c ON c.id=bc.category_id WHERE b.id=?").bind(owned.business.id).first();
  const logo=await owned.db.prepare("SELECT file_url FROM business_media WHERE business_id=? AND kind='logo' ORDER BY id DESC LIMIT 1").bind(owned.business.id).first();
  return Response.json({ok:true,business:{...owned.business,...details,logo:logo?.file_url||null},services:services.results||[],supportingImages,templates,availableTemplates,selectedImage,url,expiresAt:subscription.ends_at},{headers});
}

export async function POST(request:Request){
  const headers={"Cache-Control":"private, no-store"};
  const owned=await getOwnedBusiness(request);
  if(!owned)return Response.json({ok:false},{status:401,headers});
  const subscription=await promotionSubscription(owned.db,owned.business.id);
  const body=await request.json().catch(()=>null);
  const templates=allowedStoryTemplates(subscription?.code,await storySettings(owned.db));
  if(!body||!templates.some(t=>t.id===body.template)||body.error!=="RENDER_FAILED")return Response.json({ok:false},{status:400,headers});
  await ensureStoryErrors(owned.db);
  await owned.db.prepare("INSERT INTO story_generation_errors(business_id,template_id,error_code) VALUES(?,?,'RENDER_FAILED')").bind(owned.business.id,body.template).run();
  await owned.db.prepare("DELETE FROM story_generation_errors WHERE created_at<datetime('now','-30 days')").run();
  return Response.json({ok:true},{headers});
}

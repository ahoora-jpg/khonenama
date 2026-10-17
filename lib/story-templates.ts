export const STORY_TEMPLATES = [
  {id:1,name:"مینیمال",minimumPlan:"pro",background:"#f4efe6",ink:"#252b27",accent:"#a78052",layout:"minimal"},
  {id:2,name:"لوکس",minimumPlan:"pro",background:"#191612",ink:"#fff5df",accent:"#d1ad6c",layout:"luxury"},
  {id:3,name:"معرفی محصول",minimumPlan:"premium",background:"#e8edef",ink:"#152b3a",accent:"#728995",layout:"product"},
  {id:4,name:"معرفی کسب‌وکار",minimumPlan:"premium",background:"#eee9df",ink:"#293c32",accent:"#ad8c5a",layout:"vendor"},
] as const;
export type StoryTemplate = {id:number;name:string;minimumPlan:string;background:string;ink:string;accent:string;layout:string;enabled?:boolean;showPhone?:boolean;showCity?:boolean;showCategory?:boolean;backgroundAsset?:string};
// Reserved for a separately approved, server-side integration. No API or credit spending is enabled.
export const FUTURE_AI_STORY_POLICY = {enabled:false,monthlyCredits:{free:0,pro:0,premium:1}} as const;
export function allowedStoryTemplates(code:unknown,templates:readonly StoryTemplate[]=STORY_TEMPLATES) {
  if(code!=="pro"&&code!=="premium")return [];
  return templates.filter(t=>t.enabled!==false&&(code==="premium"||t.minimumPlan==="pro"));
}

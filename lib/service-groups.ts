import {BUSINESS_CATEGORIES} from "./business-taxonomy";
export function broadServiceGroup(service:string){
 if(/دوخت/.test(service))return "دوخت پرده";
 if(/نصب|اندازه‌گیری|زیرسازی|اجرا/.test(service))return "نصب و اجرا";
 if(/طراحی/.test(service))return "طراحی";
 if(/تعمیر|شست|نظافت|تعویض/.test(service))return "تعمیر و نگهداری";
 const category=BUSINESS_CATEGORIES.find(item=>item.services.includes(service));
 return ({curtain:"پرده",flooring:"کفپوش",carpet:"موکت",wallpaper:"کاغذ دیواری و دیوارپوش","interior-design":"طراحی داخلی","smart-home":"خانه هوشمند"} as Record<string,string>)[category?.slug||""] || "سایر خدمات";
}
export function groupServices(services:string[]){const groups=new Map<string,string[]>();for(const service of services){const label=broadServiceGroup(service);groups.set(label,[...(groups.get(label)||[]),service]);}return [...groups].map(([label,items])=>({label,items}));}

import type { StoryTemplate } from "./story-templates";
export type StoryVendor={name:string;city?:string;phone?:string;instagram?:string;category?:string;logo?:string;description?:string};
export type StoryInput={template:StoryTemplate;vendor:StoryVendor;photo:string;qr:string;brand:string;title?:string;tagline?:string;features?:string[];cropX?:number;cropY?:number;format?:"story"|"card"};
async function image(url:string){const img=new Image();img.crossOrigin="anonymous";await new Promise<void>((resolve,reject)=>{img.onload=()=>resolve();img.onerror=()=>reject(new Error("دریافت عکس یا لوگو ممکن نشد؛ عکس دیگری انتخاب کنید و دوباره تلاش کنید."));img.src=url;});return img;}
function cover(ctx:CanvasRenderingContext2D,img:HTMLImageElement,x:number,y:number,w:number,h:number,cx=.5,cy=.5){const scale=Math.max(w/img.naturalWidth,h/img.naturalHeight);ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.drawImage(img,x-(img.naturalWidth*scale-w)*cx,y-(img.naturalHeight*scale-h)*cy,img.naturalWidth*scale,img.naturalHeight*scale);ctx.restore();}
function box(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,color:string,r=26){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function text(ctx:CanvasRenderingContext2D,value:string,x:number,y:number,width:number,size:number,color:string,maxLines=2){
  ctx.direction="rtl";ctx.textAlign="right";ctx.fillStyle=color;ctx.font=`${size}px "DigiHamishe"`;
  const clean=String(value||"").replace(/[\u0000-\u001f]/g," ");
  while(ctx.measureText(clean).width>width*maxLines&&size>22){size-=2;ctx.font=`${size}px "DigiHamishe"`;}
  let line="";const lines:string[]=[];
  for(const word of clean.split(/\s+/)){if(line&&ctx.measureText(line+" "+word).width>width){lines.push(line);line=word;}else line+=(line?" ":"")+word;}
  if(line)lines.push(line);
  lines.slice(0,maxLines).forEach((line,i)=>ctx.fillText(line,x,y+i*(size+16),width));
  return y+Math.min(lines.length,maxLines)*(size+16);
}
export async function renderStory(input:StoryInput){
  await document.fonts.load('48px "DigiHamishe"');
  if(!document.fonts.check('48px "DigiHamishe"'))throw new Error("فونت سایت آماده نشد؛ دوباره تلاش کنید.");
  const [hero,qr,brand,logo,background]=await Promise.all([image(input.photo),image(input.qr),image(input.brand),input.vendor.logo?image(input.vendor.logo):null,input.template.backgroundAsset?image(input.template.backgroundAsset):null]);
  if(hero.naturalWidth<240||hero.naturalHeight<240)throw new Error("عکس خیلی کوچک است؛ تصویری با ابعاد بیشتر انتخاب کنید.");
  const canvas=document.createElement("canvas");canvas.width=1080;canvas.height=1920;
  const ctx=canvas.getContext("2d",{colorSpace:"srgb"});if(!ctx)throw new Error("مرورگر امکان ساخت تصویر را ندارد.");
  const t=input.template;ctx.fillStyle=t.background;ctx.fillRect(0,0,1080,1920);
  if(background)cover(ctx,background,0,0,1080,1920);
  const luxury=t.layout==="luxury",product=t.layout==="product",vendor=t.layout==="vendor";
  const cx=Math.min(1,Math.max(0,input.cropX??.5)),cy=Math.min(1,Math.max(0,input.cropY??.5));
  if(luxury){cover(ctx,hero,0,0,1080,1920,cx,cy);const gradient=ctx.createLinearGradient(0,0,0,1920);gradient.addColorStop(0,"#090705e8");gradient.addColorStop(.3,"#0907050a");gradient.addColorStop(.6,"#09070520");gradient.addColorStop(1,"#090705ff");ctx.fillStyle=gradient;ctx.fillRect(0,0,1080,1920);}
  else cover(ctx,hero,product?0:48,430,product?1080:984,950,cx,cy);
  if(logo){box(ctx,72,250,130,130,"#ffffff");const scale=Math.min(108/logo.naturalWidth,108/logo.naturalHeight);ctx.drawImage(logo,83+(108-logo.naturalWidth*scale)/2,261+(108-logo.naturalHeight*scale)/2,logo.naturalWidth*scale,logo.naturalHeight*scale);}
  const left=logo?240:72,width=1008-left;
  const nameEnd=text(ctx,input.vendor.name,1008,280,width,54,t.ink,2);
  if(input.tagline)text(ctx,input.tagline,1008,Math.min(400,nameEnd+6),width,28,t.ink,1);
  if(luxury){ctx.strokeStyle=t.accent;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(72,410);ctx.lineTo(1008,410);ctx.stroke();}
  if(input.title){box(ctx,product?96:72,product?1140:1120,product?888:936,120,luxury?"#17130fdd":"#ffffffed");text(ctx,input.title,product?936:972,product?1215:1195,product?792:864,42,luxury?t.ink:t.background==="#191612"?"#222":t.ink,1);}
  const features=(input.features||[]).filter(Boolean).slice(0,3);
  if(vendor&&input.vendor.description&&!features.length){box(ctx,72,1240,936,150,"#ffffffef",20);text(ctx,input.vendor.description.slice(0,160),972,1290,864,30,t.ink,2);}
  if(features.length){features.forEach((feature,i)=>{box(ctx,72,1250+i*56,936,50,luxury?"#17130fd9":"#ffffffdf",18);text(ctx,feature,972,1287+i*56,864,26,t.ink,1);});}
  const footerY=1430;
  ctx.save();ctx.shadowColor="#00000018";ctx.shadowBlur=32;ctx.shadowOffsetY=10;
  box(ctx,48,footerY,984,240,luxury?"#17130ff2":"#ffffffee",28);ctx.restore();
  // The quiet zone is part of the source QR; do not crop or decorate it.
  box(ctx,72,footerY+18,204,204,"#ffffff",12);ctx.drawImage(qr,78,footerY+24,192,192);
  let y=footerY+42;
  if(t.showCity!==false&&input.vendor.city)y=text(ctx,input.vendor.city,984,y,640,28,t.ink,1)+4;
  if(t.showCategory!==false&&input.vendor.category)y=text(ctx,input.vendor.category,984,y,640,26,t.ink,1)+4;
  if(t.showPhone!==false&&input.vendor.phone){ctx.direction="ltr";ctx.textAlign="right";ctx.fillStyle=t.ink;ctx.font='28px "DigiHamishe"';ctx.fillText(input.vendor.phone,984,y,640);y+=36;}
  if(input.vendor.instagram)text(ctx,input.vendor.instagram,984,y,640,24,t.ink,1);
  text(ctx,"مشاهده غرفه در خونه‌نما",984,1640,420,24,t.ink,1);
  box(ctx,315,1600,210,50,"#ffffff",12);ctx.drawImage(brand,325,1605,40,40);text(ctx,"خونه‌نما",510,1635,132,26,"#25382e",1);
  let output=canvas;
  if(input.format==="card") {
    output=document.createElement("canvas");output.width=1080;output.height=1080;const c=output.getContext("2d")!;
    c.fillStyle=t.background;c.fillRect(0,0,1080,1080);cover(c,hero,40,40,1000,570,cx,cy);
    text(c,input.vendor.name,1010,700,920,58,t.ink,2);
    if(input.vendor.city)text(c,input.vendor.city,1010,835,650,34,t.ink,1);
    if(input.vendor.phone)text(c,input.vendor.phone,1010,890,650,32,t.ink,1);
    box(c,40,790,220,220,"#ffffff",12);c.drawImage(qr,50,800,200,200);
    text(c,"مشاهده غرفه در خونه‌نما",1010,1000,650,32,t.ink,1);
    box(c,315,955,170,65,"#ffffff",12);c.drawImage(brand,325,965,45,45);text(c,"خونه‌نما",475,1003,95,24,"#25382e",1);
  }
  return {png:output.toDataURL("image/png"),jpg:output.toDataURL("image/jpeg",.94),lowResolution:hero.naturalWidth<1080||hero.naturalHeight<1200};
}

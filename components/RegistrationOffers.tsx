"use client";
import { useEffect, useState } from "react";
import { businessPlans } from "@/lib/business-plans";

const currentPlanArtwork: Record<string, string> = {
  free: "/images/plans/free-20261030.png",
  pro: "/images/plans/pro-20261030.png",
  premium: "/images/plans/premium-20261030.png",
  custom: "/images/plans/custom-20261030.png",
};

export function RegistrationGift() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const update = () => setVisible(Date.now() < Date.parse("2026-11-21T20:30:00Z"));
    update(); const timer = setInterval(update, 60000); return () => clearInterval(timer);
  }, []);
  return visible ? <aside dir="rtl" style={{marginBottom: "1.5rem"}}><img src="/images/offers/welcome-pro-aban-1405.webp" width={1448} height={1086} alt="هدیه آغاز فعالیت: با تکمیل پروفایل تا پایان ۳۰ آبان ۱۴۰۵ از امکانات حرفه‌ای رایگان استفاده کنید." style={{display:"block",width:"100%",maxWidth:720,height:"auto",margin:"auto",borderRadius:20}} /></aside> : null;
}

export function RegistrationPlanImages() {
  const cards = [...businessPlans, { code: "custom", name: "افزونه ویژه" }];
  return <div className="registration-plan-images">{cards.map((plan)=><article key={plan.code}><img src={currentPlanArtwork[plan.code]} width={1000} height={1000} alt={plan.code === "custom" ? "افزونه ویژه؛ فعلاً غیرفعال" : `پلن ${plan.name}`} loading="lazy" /></article>)}</div>;
}

export function PublicPlanPrice({code, normal}: {code:string; normal:string}) {
  return <>{code === "free" ? "رایگان بدون محدودیت زمانی" : code === "pro" || code === "premium" ? "رایگان تا پایان ۱۵ بهمن ۱۴۰۵" : normal}</>;
}

export function PlanArtwork({code, name}: {code:string; name:string}) {
  return <img className="billing-plan-image" src={currentPlanArtwork[code]} width={1000} height={1000} alt={`معرفی اشتراک ${name}`} loading="lazy" />;
}

"use client";
import { useEffect, useState } from "react";
import { businessPlans, LAUNCH_DISCOUNT_END_AT } from "@/lib/business-plans";

export function RegistrationGift() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const update = () => setVisible(Date.now() < Date.parse("2026-11-21T20:30:00Z"));
    update(); const timer = setInterval(update, 60000); return () => clearInterval(timer);
  }, []);
  return visible ? <aside dir="rtl" style={{marginBottom: "1.5rem"}}><img src="/images/offers/welcome-pro-aban-1405.webp" width={1448} height={1086} alt="هدیه آغاز فعالیت: با تکمیل پروفایل تا پایان ۳۰ آبان ۱۴۰۵ از امکانات حرفه‌ای رایگان استفاده کنید." style={{display:"block",width:"100%",maxWidth:720,height:"auto",margin:"auto",borderRadius:20}} /></aside> : null;
}

export function RegistrationPlanImages() {
  const [discount, setDiscount] = useState(false);
  useEffect(() => {
    const update = () => setDiscount(Date.now() < Date.parse(LAUNCH_DISCOUNT_END_AT));
    update(); const timer = setInterval(update, 60000); return () => clearInterval(timer);
  }, []);
  return <div className="registration-plan-images">{businessPlans.map((plan,index)=><article key={plan.code}><img src={discount && plan.code !== "free" ? `/images/plans/${plan.code}-discount-dey-1405.webp` : `/images/plans/${plan.code}-20261015.webp`} width={1000} height={1000} alt={`پلن ${plan.name}: ${[10,30,70][index]} عکس و ${[0,2,5][index]} ویدیو${discount && plan.code !== "free" ? `؛ ${plan.code === "pro" ? "۱۵۰" : "۲۵۰"} هزار تومان تا پایان دی` : `؛ ${plan.priceLabel}`}`} loading="lazy" /></article>)}</div>;
}

export function PublicPlanPrice({code, normal}: {code:string; normal:string}) {
  const [discount, setDiscount] = useState(false);
  useEffect(() => { const update = () => setDiscount(Date.now() < Date.parse(LAUNCH_DISCOUNT_END_AT)); update(); const timer = setInterval(update,60000); return () => clearInterval(timer); }, []);
  return <>{discount && code !== "free" ? `${code === "pro" ? "۱۵۰" : "۲۵۰"} هزار تومان برای ۳۰ روز تا پایان دی ۱۴۰۵` : normal}</>;
}

export function PlanArtwork({code, name}: {code:string; name:string}) {
  const [discount, setDiscount] = useState(false);
  useEffect(() => { const update = () => setDiscount(Date.now() < Date.parse(LAUNCH_DISCOUNT_END_AT)); update(); const timer = setInterval(update,60000); return () => clearInterval(timer); }, []);
  return <img className="billing-plan-image" src={discount && code !== "free" ? `/images/plans/${code}-discount-dey-1405.webp` : `/images/plans/${code}-20261015.webp`} width={1000} height={1000} alt={`معرفی اشتراک ${name}`} loading="lazy" />;
}

import type { Metadata } from "next";
import LocalSeoLanding from "@/components/LocalSeoLanding";

export async function generateMetadata(): Promise<Metadata> {
  const title = "خانه هوشمند کرج | Matter، روشنایی، پرده برقی و امنیت";
  const description =
    "متخصصان خانه هوشمند در کرج را برای Matter، روشنایی هوشمند، پرده برقی، قفل، امنیت، کنترل دما و سناریوهای اتوماسیون مقایسه کنید.";
  const url = "https://khonenama.ir/karaj/smart-home";

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, locale: "fa_IR", type: "website" },
    twitter: { card: "summary", title, description },
  };
}

export default function KarajSmartHomePage() {
  return (
    <LocalSeoLanding
      categorySlug="smart-home"
      h1="خانه هوشمند در کرج"
      intro="برای هوشمندسازی خانه در کرج، نوع سیستم، امکان توسعه، پشتیبانی، امنیت و سازگاری تجهیزات را کنار قیمت مقایسه کنید."
      intentCards={[
        {
          title: "هوشمندسازی خانه از کجا شروع شود؟",
          text: "روشنایی، پرده برقی و قفل هوشمند از نقاط شروع رایج‌اند؛ اولویت را بر اساس نیاز روزمره، امنیت و بودجه مشخص کنید.",
        },
        {
          title: "هزینه خانه هوشمند در کرج",
          text: "هزینه به تعداد نقاط کنترل، برند تجهیزات، پروتکل، تابلو برق، سیم‌کشی و سطح یکپارچگی بستگی دارد؛ پیشنهادها را با دامنه یکسان مقایسه کنید.",
        },
        {
          title: "خانه قدیمی هم هوشمند می‌شود؟",
          text: "در بسیاری از پروژه‌ها بله. بعضی راهکارها بدون تغییر اساسی سیم‌کشی قابل اجرا هستند و بعضی سیستم‌ها زیرساخت بیشتری می‌خواهند.",
        },
        {
          title: "پرده برقی و روشنایی هوشمند",
          text: "اگر این دو بخش از ابتدا هماهنگ طراحی شوند، سناریوهایی مثل ورود، خواب، مهمانی و کنترل نور طبیعی کاربردی‌تر می‌شوند.",
        },
      ]}
      faqs={[
        {
          question: "برای خانه هوشمند حتماً اینترنت لازم است؟",
          answer: "بستگی به معماری سیستم دارد. بعضی فرمان‌های محلی بدون اینترنت کار می‌کنند، اما کنترل از راه دور و قابلیت‌های ابری معمولاً به اینترنت وابسته‌اند.",
        },
        {
          question: "قبل از انتخاب مجری خانه هوشمند چه چیزهایی را بپرسیم؟",
          answer: "پروتکل، برند تجهیزات، گارانتی، خدمات پس از فروش، امکان توسعه، سناریوهای قابل اجرا و نحوه کار سیستم هنگام قطعی اینترنت را شفاف کنید.",
        },
        {
          question: "آیا می‌شود هوشمندسازی را مرحله‌ای انجام داد؟",
          answer: "بله، اگر معماری و تجهیزات از ابتدا امکان توسعه داشته باشند می‌توان پروژه را از چند بخش اصلی شروع و بعداً گسترش داد.",
        },
      ]}
      guides={[
        { title: "Matter، Thread، Zigbee یا Wi‑Fi؟", text: "راهنمای انتخاب پروتکل در ۲۰۲۶", href: "/magazine/matter-thread-zigbee-wifi-guide-2026" },
        { title: "امنیت خانه هوشمند", text: "چک‌لیست امنیت دوربین، قفل و شبکه", href: "/magazine/smart-home-security-guide-2026" },
        { title: "هزینه خانه هوشمند در کرج", text: "عوامل قیمت و مقایسه پیشنهادها", href: "/magazine/smart-home-karaj-cost-guide" },
        { title: "خانه هوشمند چیست؟", text: "راهنمای شروع بدون هزینه‌های اضافه", href: "/magazine/smart-home-guide" },
        { title: "روشنایی هوشمند", text: "کلید، دیمر و سناریوی نور", href: "/magazine/smart-lighting-guide" },
        { title: "پرده برقی و هوشمند", text: "موتور، کنترل و نکات نصب", href: "/magazine/smart-curtain-guide" },
      ]}
    />
  );
}

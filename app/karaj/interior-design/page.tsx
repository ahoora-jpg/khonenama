import type { Metadata } from "next";
import LocalSeoLanding from "@/components/LocalSeoLanding";

export async function generateMetadata(): Promise<Metadata> {
  const title = "طراحی داخلی کرج | انتخاب طراح و دکوراسیون";
  const description =
    "طراحان و خدمات طراحی داخلی در کرج را مقایسه کنید؛ ترندهای ۲۰۲۶، چیدمان، رنگ، نور، نمونه‌کار، بودجه و فرآیند طراحی و اجرا.";
  const url = "https://khonenama.ir/karaj/interior-design";

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, locale: "fa_IR", type: "website" },
    twitter: { card: "summary", title, description },
  };
}

export default function KarajInteriorDesignPage() {
  return (
    <LocalSeoLanding
      categorySlug="interior-design"
      h1="طراحی داخلی در کرج"
      intro="طراحان و مجریان طراحی داخلی در کرج را بر اساس نمونه‌کار، نوع پروژه، محدوده خدمات و فرآیند همکاری مقایسه کنید."
      intentCards={[
        { title: "بهترین طراح داخلی کرج", text: "بهترین انتخاب به سبک، بودجه و نوع پروژه شما بستگی دارد؛ نمونه‌کار مشابه را معیار اصلی قرار دهید." },
        { title: "هزینه طراحی داخلی", text: "روش قیمت‌گذاری می‌تواند متری، پروژه‌ای یا مرحله‌ای باشد؛ خروجی‌ها و خدمات را قبل از مقایسه قیمت یکسان کنید." },
        { title: "طراحی تا اجرا", text: "مشخص کنید طراح فقط طرح می‌دهد یا خرید متریال، نظارت و اجرای پروژه را هم پوشش می‌دهد." },
        { title: "طراح نزدیک من", text: "دسترسی برای بازدید و نظارت مزیت است، اما تجربه پروژه مشابه و فرآیند حرفه‌ای مهم‌تر است." },
      ]}
      faqs={[
        { question: "قبل از قرارداد با طراح داخلی چه چیزهایی را مشخص کنیم؟", answer: "خروجی‌ها، تعداد اصلاحات، زمان‌بندی، مبلغ، نحوه پرداخت و مسئولیت اجرا باید روشن باشد." },
        { question: "طراحی داخلی شامل اجرا هم می‌شود؟", answer: "همیشه نه؛ محدوده خدمات بسته به قرارداد متفاوت است و باید قبل از شروع مشخص شود." },
      ]}
      guides={[
        { title: "ترندهای طراحی داخلی ۲۰۲۶", text: "فضای گرم، شخصی و فناوری یکپارچه", href: "/magazine/interior-design-trends-2026" },
        { title: "رنگ سال ۲۰۲۶ در دکوراسیون", text: "راهنمای اجرای Cloud Dancer", href: "/magazine/pantone-cloud-dancer-2026-interior-guide" },
        { title: "طراحی داخلی خانه کوچک", text: "۱۲ اصل برای آپارتمان کم‌متراژ", href: "/magazine/small-apartment-interior-design-guide" },
        { title: "هزینه طراحی داخلی در کرج", text: "روش قیمت‌گذاری و نکات قرارداد", href: "/magazine/interior-design-karaj-cost-guide" },
        { title: "چطور طراح داخلی انتخاب کنیم؟", text: "معیارهای مهم قبل از قرارداد", href: "/magazine/choose-interior-designer" },
        { title: "مراحل طراحی داخلی منزل", text: "از نیازسنجی تا اجرا", href: "/magazine/interior-design-process" },
      ]}
    />
  );
}

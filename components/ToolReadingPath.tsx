import { getGuide } from "@/lib/guides";
const readingPaths = {
  curtain: {text:"برآورد پارچه به معنی تأیید ابعاد نهایی سفارش نیست؛ مدل دوخت، تکرار طرح و محل نصب را مشخص کنید. این ابزار اندازه قاب شید، پنل شاتر یا تعداد قطعات یراق را تعیین نمی‌کند.",guides:["curtain-fullness-guide","ripple-fold-vs-pinch-pleat-vs-grommet","curtain-installation-guide"]},
  flooring: {text:"نوع عرضه را درست انتخاب کنید: بسته با پوشش معلوم یا رول با عرض معلوم. این نتیجه مقدار رزین، میکروسمنت یا مواد زیرسازی را تعیین نمی‌کند؛ سطح اجرا و مقدار خرید یکسان نیستند.",guides:["specialty-flooring-selection-guide","laminate-underlay-guide","skirting-floor-profiles-guide"]},
  carpet: {text:"عرض رول و طول برش، یا اندازه تایل و تعداد داخل بسته را از مشخصات همان محصول وارد کنید. جهت خواب، طرح، درز و دوردوزی ممکن است مقدار یا هزینه نهایی را تغییر دهند.",guides:["roll-carpet-vs-carpet-tile","carpet-construction-fiber-selection-guide","carpet-binding-doormat-guide"]},
  wallpaper: {text:"این ابزار برای محصول رولی با طول و عرض مشخص است؛ تعداد پنل، ورق، پوستر سفارشی یا مواد دیوارپوش اجراشونده را محاسبه نمی‌کند. برای آن‌ها پوشش مؤثر و نقشه برش لازم است.",guides:["wallpaper-primer-sizing-guide","paste-the-wall-vs-paste-the-paper-guide","specialty-wallcovering-selection-guide"]},
  "smart-home": {text:"فهرست نقاط، برآورد اولیه نیاز پروژه است؛ جای نقشه برق، بررسی سازگاری تجهیزات و طراحی نهایی را نمی‌گیرد. قابلیت کنترل در نبود اینترنت و روش استفاده دستی را جدا با مجری تأیید کنید.",guides:["smart-home-without-internet-guide","matter-controller-thread-border-router-guide","smart-home-security-guide-2026"]},
} as const;
export default function ToolReadingPath({category}:{category:keyof typeof readingPaths}) {
 const path=readingPaths[category];
 return <section className="category-results" aria-label="راهنمای استفاده از برآورد"><h2>از برآورد تا سفارش قابل بررسی</h2><p>{path.text}</p><ul>{path.guides.map(slug=>{const guide=getGuide(slug);return guide?<li key={slug}><a href={"/magazine/"+slug}>{guide.title}</a></li>:null})}</ul><a href={"/category/"+category}>خدمات و کسب‌وکارهای مرتبط را مقایسه کنید</a></section>;
}

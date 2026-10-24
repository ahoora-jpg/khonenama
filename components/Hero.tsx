import ServiceSearchSuggestions from "@/components/ServiceSearchSuggestions";
import { ArrowUpLeft, MapPin, Search, Store } from "lucide-react";
export default function Hero() {
 return <section className="market-hero" id="top"><div className="shell market-hero-layout">
 <div className="market-hero-copy">
 <span className="section-kicker">بازار تخصصی پرده و دکوراسیون خانه</span>
 <h1>خونه نما؛<br /><span>بازار پرده و دکوراسیون</span> داخلی خانه</h1>
 <p>فروشگاه‌ها و متخصصان دکوراسیون داخلی را همین‌جا ببین و بر اساس شهر و خدمت انتخاب کن.</p>
 <form className="market-search" action="/search" method="get">
 <label><Search size={19} /><span><small>چه چیزی نیاز داری؟</small><input name="q" list="khonenama-service-search" aria-label="خدمت یا محصول" placeholder="پرده، پارکت یا طراح داخلی…" /></span></label>
 <label><MapPin size={19} /><span><small>در کدام شهر یا محله؟</small><input name="location" aria-label="شهر یا محله" placeholder="شهر یا محله خودت" /></span></label>
 <button type="submit">پیدا کردن کسب‌وکار <ArrowUpLeft size={18} /></button></form><ServiceSearchSuggestions />
 <div className="market-hero-shortcuts"><a href="#shops"><Store size={16} /> دیدن غرفه‌ها</a><a href="/category/curtain">فروشگاه‌ها و خدمات پرده <ArrowUpLeft size={15} /></a></div></div>
 </div></section>;
}

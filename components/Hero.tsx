import { ArrowUpLeft, MapPin, Search, Store } from "lucide-react";
export default function Hero() {
 return <section className="market-hero" id="top"><div className="shell market-hero-layout"><div className="market-hero-copy">
 <span className="section-kicker">بازار تخصصی پرده و دکوراسیون خانه</span>
 <h1>برای خانه‌ات،<br /><span>کسب‌وکار مناسب</span> پیدا کن.</h1>
 <p>فروشگاه‌ها و متخصصان دکوراسیون داخلی را پیدا کن، نمونه‌کارهایشان را ببین و با نظر مشتریان، آگاهانه انتخاب کن.</p>
 <form className="market-search" action="/search" method="get">
 <label><Search size={19} /><span><small>چه چیزی نیاز داری؟</small><input name="q" aria-label="خدمت یا محصول" placeholder="پرده، پارکت یا طراح داخلی…" /></span></label>
 <label><MapPin size={19} /><span><small>در کدام شهر یا محله؟</small><input name="location" aria-label="شهر یا محله" placeholder="شهر یا محله خودت" /></span></label>
 <button type="submit">پیدا کردن کسب‌وکار <ArrowUpLeft size={18} /></button></form>
 <div className="market-hero-shortcuts"><a href="#shops"><Store size={16} /> دیدن غرفه‌ها</a><a href="/category/curtain">فروشگاه‌ها و خدمات پرده <ArrowUpLeft size={15} /></a></div></div>
 <div className="market-hero-visual"><img src="/images/editorial/photo-1602612996819-3cd306f68b4e.webp" alt="الهام از پرده و نور طبیعی در فضای داخلی خانه" width={720} height={820} fetchPriority="high" />
 <div className="market-visual-caption"><small>نور، بافت و یک انتخاب خوب</small><strong>خانه از همین جزئیات شروع می‌شود.</strong><a href="/category/curtain">از پرده شروع کن <ArrowUpLeft size={18} /></a></div>
 <span className="market-visual-note">تصویر الهام‌بخش؛ نمونه‌کار یک غرفه نیست</span></div></div></section>;
}

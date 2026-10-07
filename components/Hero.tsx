import { ArrowUpLeft, MapPin, Search, Store } from "lucide-react";
import HeroCoverflow from "./HeroCoverflow";
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
 <div className="market-hero-carousel"><HeroCoverflow /><p className="hero-image-note">تصاویر الهام‌بخش؛ نمونه‌کار غرفه‌ها را در بخش بعد ببینید.</p></div></div></section>;
}

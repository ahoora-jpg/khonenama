import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Building2, ImagePlus, MapPin, Phone, Store } from "lucide-react";

export default function RegisterBusinessPage() {
  return (
    <main>
      <Header />
      <section className="inner-page register-page">
        <div className="shell register-layout">
          <div className="register-intro">
            <span className="section-kicker">ثبت کسب‌وکار</span>
            <h1>فروشگاهت را در خونه‌نما معرفی کن.</h1>
            <p>این فرم نسخه اولیه رابط ثبت است؛ ذخیره واقعی اطلاعات بعد از اتصال D1 و احراز هویت فعال می‌شود.</p>
            <div className="register-benefits">
              <div><Store size={20} /><span><strong>پروفایل اختصاصی</strong><small>خدمات، تصاویر و راه‌های ارتباطی</small></span></div>
              <div><MapPin size={20} /><span><strong>جستجوی محلی</strong><small>نمایش بر اساس شهر و محله</small></span></div>
              <div><ImagePlus size={20} /><span><strong>نمونه‌کار</strong><small>گالری پروژه‌ها و محصولات</small></span></div>
            </div>
          </div>

          <form className="register-form glass-panel">
            <div className="form-row two-columns">
              <label><span>نام کسب‌وکار</span><div className="form-input"><Building2 size={17} /><input placeholder="مثلاً پرده سرای ..." /></div></label>
              <label><span>دسته اصلی</span><select defaultValue="curtain"><option value="curtain">پرده و متعلقات</option><option value="flooring">کفپوش و پارکت</option><option value="carpet">موکت</option><option value="wallpaper">کاغذ دیواری</option><option value="interior-design">طراحی داخلی</option></select></label>
            </div>
            <div className="form-row two-columns">
              <label><span>شماره تماس</span><div className="form-input"><Phone size={17} /><input inputMode="tel" placeholder="09..." /></div></label>
              <label><span>شهر</span><div className="form-input"><MapPin size={17} /><input defaultValue="کرج" /></div></label>
            </div>
            <label className="form-row"><span>آدرس</span><textarea rows={3} placeholder="آدرس فروشگاه یا دفتر" /></label>
            <label className="form-row"><span>معرفی کوتاه</span><textarea rows={4} placeholder="چه خدماتی ارائه می‌کنید؟" /></label>
            <button type="button" className="register-submit">ادامه ثبت کسب‌وکار</button>
            <small className="form-note">در این نسخه دکمه هنوز اطلاعات را ذخیره نمی‌کند.</small>
          </form>
        </div>
      </section>
      <Footer />
    </main>
  );
}

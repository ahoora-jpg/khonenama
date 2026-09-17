import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getBusiness } from "@/lib/demo-data";
import { BadgeCheck, MapPin, MessageCircle, Phone, Star } from "lucide-react";
import { notFound } from "next/navigation";

export default async function BusinessPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const business = getBusiness(slug);
  if (!business) notFound();

  return (
    <main>
      <Header />
      <section className="inner-page business-profile-page">
        <div className="shell">
          <div className="business-profile-hero">
            <div className="profile-cover"><div className="profile-cover-shape" /></div>
            <div className="profile-main-card glass-panel">
              <div className="profile-title-row">
                <div>
                  <div className="profile-name-line">
                    <h1>{business.name}</h1>
                    {business.verified && <BadgeCheck size={22} className="verified-icon" />}
                  </div>
                  <p>{business.description}</p>
                </div>
                {business.featured && <span className="featured-tag profile-featured">ویژه</span>}
              </div>

              <div className="profile-meta-grid">
                <div><MapPin size={17} /><span><strong>موقعیت</strong><small>{business.city}، {business.area}</small></span></div>
                <div><Star size={17} fill="currentColor" /><span><strong>{business.rating}</strong><small>{business.reviewCount} نظر نمایشی</small></span></div>
              </div>

              <div className="profile-actions">
                <a className="pill-button dark" href="tel:#"><Phone size={17} /> تماس</a>
                <a className="pill-button profile-secondary" href="#"><MessageCircle size={17} /> درخواست قیمت</a>
              </div>
            </div>
          </div>

          <div className="profile-content-grid">
            <section className="profile-section">
              <span className="section-kicker">خدمات</span>
              <h2>خدمات و تخصص‌ها</h2>
              <div className="service-chips">{business.services.map((service) => <span key={service}>{service}</span>)}</div>
            </section>

            <aside className="profile-side-card glass-panel">
              <h3>اطلاعات کسب‌وکار</h3>
              <p>این پروفایل فعلاً داده نمایشی دارد. در نسخه عملیاتی، ساعت کاری، شماره تماس، واتساپ، نقشه، شبکه‌های اجتماعی و اطلاعات احراز نمایش داده می‌شود.</p>
            </aside>
          </div>

          <section className="profile-section">
            <span className="section-kicker">نمونه‌کار</span>
            <h2>گالری پروژه‌ها</h2>
            <div className="portfolio-placeholder-grid">
              <div /><div /><div />
            </div>
          </section>
        </div>
      </section>
      <Footer />
    </main>
  );
}

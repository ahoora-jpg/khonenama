import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { listPublishedBusinesses } from "@/lib/server/public-businesses";
import { BadgeCheck, MapPin, Star } from "lucide-react";

export const metadata: Metadata = {
  title: "دکوراسیون خیابان برغان کرج | فروشگاه‌ها و خدمات",
  description:
    "فروشگاه‌ها و متخصصان پرده، کفپوش، موکت، کاغذ دیواری و دکوراسیون در خیابان برغان کرج را در خونه‌نما پیدا و مقایسه کنید.",
  alternates: { canonical: "/karaj/baraghan" },
};

export default async function BaraghanPage() {
  const publishedBusinesses = await listPublishedBusinesses({ city: "کرج", limit: 50 });
  const localBusinesses = publishedBusinesses.filter((business) =>
    business.area.includes("برغان")
  );

  return (
    <main>
      <Header />
      <section className="inner-page category-page">
        <div className="shell">
          <div className="category-hero glass-panel">
            <span className="section-kicker">راهنمای محلی خونه‌نما</span>
            <h1>دکوراسیون در خیابان برغان کرج</h1>
            <p>
              خونه‌نما از برغان شروع می‌شود؛ صفحه‌ای برای پیدا کردن و مقایسه فروشگاه‌ها و متخصصان دکوراسیون این محدوده،
              از پرده و پارچه تا کفپوش، موکت، دیوارپوش و خدمات نصب.
            </p>
          </div>

          <div className="category-results">
            <div className="section-heading compact-heading">
              <div><h2>کسب‌وکارهای برغان</h2></div>
            </div>

            {localBusinesses.length > 0 ? (
              <div className="business-grid">
                {localBusinesses.map((business) => (
                  <a className={"business-card plan-card-" + business.planCode} href={`/business/${business.slug}`} key={business.slug}>
                    <div className="business-media business-generic">
                      {business.media.find((item) => item.kind === "cover")?.url || business.media[0]?.url ? (
                        <img
                          className="business-card-cover"
                          src={business.media.find((item) => item.kind === "cover")?.url || business.media[0]?.url}
                          alt={business.name}
                          loading="lazy"
                        />
                      ) : (
                        <div className="business-media-shape" />
                      )}
                    </div>
                    <div className="business-content">
                      <div className="business-title-row">
                        <h3>{business.name}</h3>
                        {(business.verificationStatus === "verified" || business.verificationStatus === "professional") && (
                          <BadgeCheck size={18} className="verified-icon" />
                        )}
                      </div>
                      <p>{business.description}</p>
                      <div className="business-meta-row">
                        <span><MapPin size={14} /> {business.city}، {business.area}</span>
                        <span>
                          <Star size={14} fill={business.reviewCount ? "currentColor" : "none"} />
                          {business.reviewCount ? business.rating : "جدید"}
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="category-empty glass-panel">
                <strong>هنوز کسب‌وکار منتشرشده‌ای در محدوده برغان نداریم.</strong>
                <p>پس از ثبت و تأیید کسب‌وکارهای واقعی این محدوده، پروفایل‌های آن‌ها در همین صفحه نمایش داده می‌شود.</p>
                <a className="pill-button dark" href="/register-business">ثبت رایگان کسب‌وکار</a>
              </div>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { businesses as demoBusinesses } from "@/lib/demo-data";
import { listPublishedBusinesses } from "@/lib/server/public-businesses";
import { BadgeCheck, BriefcaseBusiness, Crown, MapPin, Search, SlidersHorizontal, Star } from "lucide-react";

export const metadata: Metadata = {
  title: "جستجوی دکوراسیون",
  robots: { index: false, follow: true },
  alternates: { canonical: "/search" },
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; location?: string }> }) {
  const params = await searchParams;
  const query = params.q?.trim() || "";
  const location = params.location?.trim() || "کرج";

  const liveBusinesses = await listPublishedBusinesses({
    query: query || undefined,
    city: location || undefined,
    limit: 50,
  });

  const filteredDemo = demoBusinesses.filter((business) => {
    const haystack = [business.name, business.description, ...business.services].join(" ").toLowerCase();
    const queryMatch = !query || haystack.includes(query.toLowerCase());
    const locationMatch = !location || business.city.includes(location) || business.area.includes(location);
    return queryMatch && locationMatch;
  });

  const liveSlugs = new Set(liveBusinesses.map((business) => business.slug));
  const results = [
    ...liveBusinesses.map((business) => ({
      slug: business.slug,
      name: business.name,
      description: business.description,
      city: business.city,
      area: business.area,
      services: business.services,
      verified: business.verificationStatus === "verified" || business.verificationStatus === "professional",
      rating: business.rating,
      reviewCount: business.reviewCount,
      planCode: business.planCode,
      promoted: business.promoted,
      coverUrl: business.media.find((item) => item.kind === "cover")?.url || business.media[0]?.url || "",
      source: "live" as const,
    })),
    ...filteredDemo
      .filter((business) => !liveSlugs.has(business.slug))
      .map((business) => ({
        ...business,
        planCode: business.featured ? "premium" as const : "free" as const,
        promoted: Boolean(business.featured),
        coverUrl: business.media?.find((item) => item.cover)?.url || business.media?.[0]?.url || "",
        source: "demo" as const,
      })),
  ];

  return (
    <main>
      <Header />
      <section className="inner-page search-page">
        <div className="shell">
          <div className="page-heading">
            <span className="section-kicker">نتایج جستجو</span>
            <h1>{query || "دکوراسیون"} در {location}</h1>
            <p>
              کسب‌وکارهای منتشرشده خونه‌نما بر اساس عبارت جستجو و موقعیت نمایش داده می‌شوند.
            </p>
          </div>

          <form className="results-search">
            <label><Search size={18} /><input name="q" defaultValue={query} placeholder="مثلاً پرده زبرا" /></label>
            <label><MapPin size={18} /><input name="location" defaultValue={location} /></label>
            <button>جستجو</button>
          </form>

          <div className="results-layout">
            <aside className="filters-panel glass-panel">
              <div className="filters-title"><SlidersHorizontal size={17} /> فیلترها</div>
              <label><input type="checkbox" /> فقط تأییدشده‌ها</label>
              <label><input type="checkbox" /> دارای نمونه‌کار</label>
              <label><input type="checkbox" /> بازدید در محل</label>
              <label><input type="checkbox" /> فروشگاه‌های ویژه</label>
            </aside>

            <div className="results-list">
              {results.length > 0 ? results.map((business) => (
                <a className={"result-card plan-card-" + business.planCode} href={"/business/" + business.slug} key={business.slug}>
                  <div className="result-thumb">
                    {business.coverUrl && <img src={business.coverUrl} alt={business.name} loading="lazy" />}
                  </div>
                  <div className="result-body">
                    <div className="result-title-row">
                      <h2>{business.name}</h2>
                      {business.verified && <BadgeCheck size={18} className="verified-icon" />}
                      {business.planCode === "pro" && (
                        <span className="plan-listing-badge is-pro"><BriefcaseBusiness size={13} /> حرفه‌ای</span>
                      )}
                      {business.planCode === "premium" && (
                        <span className="plan-listing-badge is-premium"><Crown size={13} /> جایگاه ویژه</span>
                      )}
                    </div>
                    <p>{business.description}</p>
                    <div className="result-tags">{business.services.slice(0, 4).map((service) => <span key={service}>{service}</span>)}</div>
                    <div className="result-meta">
                      <span><MapPin size={14} /> {business.city}، {business.area}</span>
                      <span className="rating">
                        <Star size={14} fill="currentColor" />
                        {business.reviewCount > 0 ? business.rating + " (" + business.reviewCount + ")" : "جدید"}
                      </span>
                    </div>
                  </div>
                </a>
              )) : (
                <div className="category-empty glass-panel">
                  <strong>نتیجه‌ای پیدا نشد.</strong>
                  <p>عبارت جستجو یا محدوده را کمی عمومی‌تر امتحان کنید.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

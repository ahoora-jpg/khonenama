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

function normalizeSearchText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("fa")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\u200c/g, " ")
    .replace(/\s+/g, " ");
}

const categoryAliases: Record<string, string[]> = {
  curtain: ["پرده", "پرده زبرا", "زبرا", "شید", "بلک اوت", "بلک‌اوت"],
  flooring: ["پارکت", "لمینت", "کفپوش", "pvc"],
  carpet: ["موکت", "موکت تایلی"],
  wallpaper: ["کاغذ دیواری", "دیوارپوش"],
  "interior-design": ["طراحی داخلی", "دکوراسیون داخلی", "طراح داخلی"],
  "smart-home": ["خانه هوشمند", "هوشمندسازی"],
};

function relevanceScore(
  business: { name: string; description: string; category?: string; categoryName?: string; services: string[]; city: string; area: string; promoted?: boolean },
  query: string,
  location: string,
) {
  const q = normalizeSearchText(query);
  const loc = normalizeSearchText(location);
  if (!q) return (business.promoted ? 5 : 0) + (normalizeSearchText(business.area) === loc ? 3 : 0);

  const name = normalizeSearchText(business.name);
  const description = normalizeSearchText(business.description);
  const categoryName = normalizeSearchText(business.categoryName || "");
  const services = business.services.map(normalizeSearchText);
  const aliases = (categoryAliases[business.category || ""] || []).map(normalizeSearchText);

  let score = 0;
  if (name === q) score += 120;
  else if (name.startsWith(q)) score += 95;
  else if (name.includes(q)) score += 70;

  if (categoryName === q || aliases.includes(q)) score += 100;
  else if (categoryName.includes(q) || aliases.some((item) => item.includes(q) || q.includes(item))) score += 82;

  if (services.some((item) => item === q)) score += 90;
  else if (services.some((item) => item.startsWith(q))) score += 72;
  else if (services.some((item) => item.includes(q))) score += 55;

  if (description.includes(q)) score += 24;
  if (normalizeSearchText(business.area) === loc) score += 12;
  else if (normalizeSearchText(business.city) === loc) score += 6;
  if (business.promoted) score += 2;

  return score;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    location?: string;
    verified?: string;
    media?: string;
    premium?: string;
  }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() || "";
  const location = params.location?.trim() || "کرج";
  const onlyVerified = params.verified === "1";
  const onlyMedia = params.media === "1";
  const onlyPremium = params.premium === "1";

  const liveBusinesses = await listPublishedBusinesses({
    query: query || undefined,
    location: location || undefined,
    limit: 50,
  });

  const filteredDemo = demoBusinesses.filter((business) => {
    const haystack = [business.name, business.description, ...business.services].join(" ").toLowerCase();
    const queryMatch = !query || haystack.includes(query.toLowerCase());
    const locationMatch = !location || business.city.includes(location) || business.area.includes(location);
    return queryMatch && locationMatch;
  });

  const liveSlugs = new Set(liveBusinesses.map((business) => business.slug));
  const combinedResults = [
    ...liveBusinesses.map((business) => ({
      slug: business.slug,
      name: business.name,
      description: business.description,
      city: business.city,
      area: business.area,
      services: business.services,
      category: business.category,
      categoryName: business.categoryName,
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
        categoryName: "",
        planCode: business.featured ? "premium" as const : "free" as const,
        promoted: Boolean(business.featured),
        coverUrl: business.media?.find((item) => item.cover)?.url || business.media?.[0]?.url || "",
        source: "demo" as const,
      })),
  ];

  const results = combinedResults
    .filter((business) => {
      if (onlyVerified && !business.verified) return false;
      if (onlyMedia && !business.coverUrl) return false;
      if (onlyPremium && business.planCode !== "premium") return false;
      return true;
    })
    .sort((a, b) => relevanceScore(b, query, location) - relevanceScore(a, query, location));

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
            <form className="filters-panel glass-panel" method="get">
              <input type="hidden" name="q" value={query} />
              <input type="hidden" name="location" value={location} />
              <div className="filters-title"><SlidersHorizontal size={17} /> فیلترها</div>
              <label>
                <input type="checkbox" name="verified" value="1" defaultChecked={onlyVerified} />
                فقط تأییدشده‌ها
              </label>
              <label>
                <input type="checkbox" name="media" value="1" defaultChecked={onlyMedia} />
                دارای نمونه‌کار
              </label>
              <label>
                <input type="checkbox" name="premium" value="1" defaultChecked={onlyPremium} />
                جایگاه‌های ویژه
              </label>
              <button className="pill-button dark filters-submit" type="submit">اعمال فیلتر</button>
              {(onlyVerified || onlyMedia || onlyPremium) && (
                <a className="filters-reset" href={"/search?q=" + encodeURIComponent(query) + "&location=" + encodeURIComponent(location)}>
                  پاک‌کردن فیلترها
                </a>
              )}
            </form>

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
                      {business.source === "demo" && (
                        <span className="demo-result-badge">نمونه نمایشی</span>
                      )}
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

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { businesses } from "@/lib/demo-data";
import { BadgeCheck, MapPin, Search, SlidersHorizontal, Star } from "lucide-react";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; location?: string }> }) {
  const params = await searchParams;
  const query = params.q?.trim() || "دکوراسیون";
  const location = params.location?.trim() || "کرج";

  return (
    <main>
      <Header />
      <section className="inner-page search-page">
        <div className="shell">
          <div className="page-heading">
            <span className="section-kicker">نتایج جستجو</span>
            <h1>{query} در {location}</h1>
            <p>نتایج نمونه‌اند و در فاز دیتابیس به کسب‌وکارهای واقعی متصل می‌شوند.</p>
          </div>

          <form className="results-search">
            <label><Search size={18} /><input name="q" defaultValue={query} /></label>
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
              {businesses.map((business) => (
                <a className="result-card" href={`/business/${business.slug}`} key={business.slug}>
                  <div className="result-thumb" />
                  <div className="result-body">
                    <div className="result-title-row">
                      <h2>{business.name}</h2>
                      {business.verified && <BadgeCheck size={18} className="verified-icon" />}
                    </div>
                    <p>{business.description}</p>
                    <div className="result-tags">{business.services.slice(0, 4).map((service) => <span key={service}>{service}</span>)}</div>
                    <div className="result-meta">
                      <span><MapPin size={14} /> {business.city}، {business.area}</span>
                      <span className="rating"><Star size={14} fill="currentColor" /> {business.rating} ({business.reviewCount})</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

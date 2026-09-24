import { ArrowUpLeft, BookOpen } from "lucide-react";
import { guides } from "@/lib/guides";

const guideImages: Record<string, string> = {
  "پرده": "https://images.unsplash.com/photo-1598242822528-182185460969?auto=format&fit=crop&w=1000&q=80",
  "کفپوش": "https://images.unsplash.com/photo-1780817612741-f8f3785d9908?auto=format&fit=crop&w=1000&q=80",
  "موکت": "https://images.unsplash.com/photo-1628745750110-c8ddcdad2c15?auto=format&fit=crop&w=1000&q=80",
  "کاغذ دیواری": "https://images.unsplash.com/photo-1742799431910-985c27143e98?auto=format&fit=crop&w=1000&q=80",
  "طراحی داخلی": "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1000&q=80",
  "خانه هوشمند": "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1000&q=80",
};

export default function GuidesHome() {
  // Keep the first cards aligned with the strongest real search intent we have seen
  // in Search Console, while still exposing the other high-value category guides.
  const preferredSlugs = [
    "curtain-installation-guide",
    "shade-curtain-guide",
    "smart-curtain-daylight-guide",
    "zebra-vs-shade",
    "parquet-vs-laminate",
    "wallpaper-vs-wallpanel",
  ];
  const selected = preferredSlugs
    .map((slug) => guides.find((guide) => guide.slug === slug))
    .filter((guide): guide is (typeof guides)[number] => Boolean(guide));

  return (
    <section className="section guides-home" aria-labelledby="guides-home-title">
      <div className="shell">
        <div className="section-heading premium-heading">
          <div>
            <span className="section-kicker">راهنمای خونه‌نما</span>
            <h2 id="guides-home-title">اول فرق‌ها را بدان، بعد انتخاب کن.</h2>
          </div>
          <a className="text-link-arrow" href="/magazine">
            همه راهنماها <ArrowUpLeft size={16} />
          </a>
        </div>

        <div className="guides-home-grid">
          {selected.map((guide) => (
            <a className="guide-preview-card guide-preview-card-visual" href={"/magazine/" + guide.slug} key={guide.slug}>
              <div className="guide-preview-media">
                <img
                  src={guideImages[guide.category] || guideImages["طراحی داخلی"]}
                  alt={`تصویر راهنمای ${guide.title}`}
                  loading="lazy"
                />
                <span><BookOpen size={17} /> {guide.category}</span>
              </div>
              <span className="guide-preview-category">{guide.category}</span>
              <h3>{guide.title}</h3>
              <p>{guide.excerpt}</p>
              <strong>مطالعه راهنما <ArrowUpLeft size={14} /></strong>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

import { ArrowUpLeft, BookOpen } from "lucide-react";
import { guides } from "@/lib/guides";

export default function GuidesHome() {
  const preferredSlugs = [
    "zebra-vs-shade",
    "parquet-vs-laminate",
    "wallpaper-vs-paint",
    "smart-home-guide",
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
            <a className="guide-preview-card" href={"/magazine/" + guide.slug} key={guide.slug}>
              <BookOpen size={20} />
              <span>{guide.category}</span>
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

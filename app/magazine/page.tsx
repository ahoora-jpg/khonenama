import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { guides } from "@/lib/guides";
import { getGuideVisual } from "@/lib/visuals";
import { ArrowUpLeft, BookOpen, Clock3 } from "lucide-react";

export const metadata: Metadata = {
  title: "مجله خونه‌نما | راهنمای دکوراسیون، انتخاب متریال و خانه هوشمند",
  description:
    "راهنماهای کاربردی خونه‌نما درباره پرده، پارکت، کفپوش، دیوارپوش، طراحی داخلی، نورپردازی و خانه هوشمند.",
  alternates: { canonical: "/magazine" },
};

export default function MagazinePage() {
  return (
    <main>
      <Header />
      <section className="inner-page">
        <div className="shell">
          <div className="category-hero glass-panel magazine-hero">
            <span className="section-kicker">مجله خونه‌نما</span>
            <h1>راهنمای انتخاب برای خانه</h1>
            <p>
              قبل از خرید، فرق گزینه‌ها را بفهمید؛ بعد فروشگاه و متخصص مناسب را پیدا کنید.
            </p>
          </div>

          <div className="magazine-grid">
            {guides.map((guide) => (
              <article className="magazine-card" key={guide.slug}>
                <img className="magazine-card-image" src={getGuideVisual(guide.category).src} alt={getGuideVisual(guide.category).alt} loading="lazy" />
                <div className="magazine-card-top">
                  <span className="magazine-category">{guide.category}</span>
                  <span className="magazine-readtime"><Clock3 size={13} /> {guide.readTime}</span>
                </div>
                <BookOpen size={22} className="magazine-icon" />
                <h2>{guide.title}</h2>
                <p>{guide.excerpt}</p>
                <a href={"/magazine/" + guide.slug}>
                  مطالعه راهنما <ArrowUpLeft size={15} />
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

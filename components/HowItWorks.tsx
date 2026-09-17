import { MessagesSquare, SearchCheck, SlidersHorizontal } from "lucide-react";

const steps = [
  { n: "۰۱", title: "پیدا کن", text: "محصول، خدمت یا فروشگاه را بر اساس دسته و منطقه جستجو کن.", icon: SearchCheck },
  { n: "۰۲", title: "مقایسه کن", text: "پروفایل، نمونه‌کار، امتیاز و اطلاعات فروشگاه‌ها را کنار هم ببین.", icon: SlidersHorizontal },
  { n: "۰۳", title: "ارتباط بگیر", text: "مستقیم تماس بگیر یا برای چند متخصص درخواست قیمت بفرست.", icon: MessagesSquare },
];

export default function HowItWorks() {
  return (
    <section className="section" id="how-it-works">
      <div className="shell">
        <div className="section-heading compact-heading">
          <div>
            <span className="section-kicker">ساده و کاربردی</span>
            <h2>کمتر بگرد. بهتر انتخاب کن.</h2>
          </div>
        </div>
        <div className="steps-grid">
          {steps.map(({ n, title, text, icon: Icon }) => (
            <article className="step-card" key={title}>
              <div className="step-top"><span>{n}</span><Icon size={22} /></div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

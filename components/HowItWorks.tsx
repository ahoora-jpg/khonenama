import { ArrowUpLeft, MessagesSquare, SearchCheck, SlidersHorizontal } from "lucide-react";

const steps = [
  { n: "۰۱", title: "پیدا کن", text: "دسته، محصول، فروشگاه یا متخصص را بر اساس موقعیت و نیازت جستجو کن.", icon: SearchCheck },
  { n: "۰۲", title: "مقایسه کن", text: "پروفایل، خدمات، نمونه‌کار و اطلاعات محلی را یکجا کنار هم ببین.", icon: SlidersHorizontal },
  { n: "۰۳", title: "ارتباط بگیر", text: "مستقیم وارد پروفایل شو، تماس بگیر یا برای دریافت قیمت اقدام کن.", icon: MessagesSquare },
];

export default function HowItWorks() {
  return (
    <section className="section premium-how" id="how-it-works">
      <div className="shell">
        <div className="section-heading compact-heading premium-heading">
          <div>
            <span className="section-kicker">مسیر ساده خونه‌نما</span>
            <h2>کمتر بگرد. مطمئن‌تر انتخاب کن.</h2>
          </div>
          <a className="text-link-arrow" href="/search">شروع جستجو <ArrowUpLeft size={16} /></a>
        </div>

        <div className="steps-grid premium-steps">
          {steps.map(({ n, title, text, icon: Icon }) => (
            <article className="step-card premium-step-card" key={title}>
              <div className="step-top">
                <span>{n}</span>
                <div className="step-icon-wrap"><Icon size={22} /></div>
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
              <span className="step-line" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

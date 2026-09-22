import { ArrowUpLeft, Calculator, Grid3X3, HousePlug, Scissors } from "lucide-react";

const toolsList = [
  {
    eyebrow: "کاغذ دیواری",
    title: "محاسبه تعداد رول",
    text: "عرض و ارتفاع دیوار، ابعاد رول، Pattern Repeat و پرت را حساب کنید.",
    href: "/tools/wallpaper-calculator",
    icon: Calculator,
  },
  {
    eyebrow: "پرده",
    title: "محاسبه متراژ پارچه",
    text: "عرض ریل، Fullness، قد پرده و تکرار طرح را وارد کنید.",
    href: "/tools/curtain-fabric-calculator",
    icon: Scissors,
  },
  {
    eyebrow: "موکت",
    title: "برآورد موکت رول و تایلی",
    text: "متراژ طولی رول یا تعداد تایل و بسته موردنیاز را محاسبه کنید.",
    href: "/tools/carpet-estimator",
    icon: Grid3X3,
  },
  {
    eyebrow: "خانه هوشمند",
    title: "ساخت Scope اولیه",
    text: "تعداد نقاط پروژه را مشخص کنید تا پیشنهاد مجری‌ها قابل مقایسه‌تر شود.",
    href: "/tools/smart-home-scope",
    icon: HousePlug,
  },
] as const;

export default function HomeTools() {
  return (
    <section className="home-tools-section" aria-labelledby="home-tools-title">
      <div className="shell">
        <div className="section-heading home-tools-heading">
          <div>
            <span className="section-kicker">ابزارهای رایگان خونه‌نما</span>
            <h2 id="home-tools-title">قبل از خرید، دقیق‌تر حساب کن.</h2>
            <p>محاسبه‌گرهای ساده و کاربردی برای کاهش حدس، پرت و پیشنهادهای غیرقابل مقایسه.</p>
          </div>
          <a className="home-tools-all" href="/tools">همه ابزارها <ArrowUpLeft size={15} /></a>
        </div>

        <div className="home-tools-grid">
          {toolsList.map((item) => {
            const Icon = item.icon;
            return (
              <a className="home-tool-card glass-panel" href={item.href} key={item.href}>
                <span className="home-tool-icon"><Icon size={21} /></span>
                <div>
                  <span className="section-kicker">{item.eyebrow}</span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
                <ArrowUpLeft size={17} />
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { businessPlans } from "@/lib/business-plans";
import { Check, CreditCard, FileText, ReceiptText, ShieldCheck, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "اشتراک و پرداخت | پنل کسب‌وکار",
  robots: { index: false, follow: false },
};

export default function BillingPage() {
  return (
    <main>
      <Header />
      <section className="inner-page dashboard-page">
        <div className="shell">
          <div className="dashboard-heading">
            <div>
              <span className="section-kicker">صورتحساب و اشتراک</span>
              <h1>پلن کسب‌وکار</h1>
              <p>پرداخت‌ها فقط بعد از نهایی‌شدن قیمت و اتصال درگاه فعال می‌شوند. مبلغ از تنظیمات سرور خوانده می‌شود، نه از مرورگر.</p>
            </div>
            <a className="pill-button" href="/dashboard">بازگشت به داشبورد</a>
          </div>

          <div className="billing-security-strip">
            <span><ShieldCheck size={17} /> اطلاعات کارت در خونه‌نما ذخیره نمی‌شود</span>
            <span><ReceiptText size={17} /> هر پرداخت با فاکتور و شناسه مستقل</span>
            <span><CreditCard size={17} /> فعال‌سازی فقط بعد از Verify درگاه</span>
          </div>

          <div className="business-plan-grid billing-plan-grid">
            {businessPlans.map((plan) => (
              <article className={"business-plan-card " + (plan.code === "pro" ? "is-highlighted" : "")} key={plan.code}>
                <span className="business-plan-badge">{plan.badge}</span>
                <h2>{plan.name}</h2>
                <strong>{plan.priceLabel}</strong>
                <p>{plan.description}</p>
                <ul>
                  {plan.features.map((feature) => <li key={feature}><Check size={15} /> {feature}</li>)}
                </ul>
                {plan.code === "free" ? (
                  <span className="billing-current-plan"><Check size={14} /> پلن فعلی</span>
                ) : (
                  <button className="pill-button billing-disabled" type="button" disabled>
                    <Sparkles size={15} /> فعال‌سازی پس از تعیین قیمت
                  </button>
                )}
              </article>
            ))}
          </div>

          <div className="billing-grid">
            <section className="dashboard-panel glass-panel">
              <div className="panel-heading">
                <div><span className="section-kicker">منطق محاسبه</span><h2>مبلغ پرداخت چطور تعیین می‌شود؟</h2></div>
                <FileText size={20} />
              </div>
              <ol className="billing-flow-list">
                <li><span>۱</span><p>کاربر فقط <b>شناسه پلن</b> را انتخاب می‌کند.</p></li>
                <li><span>۲</span><p>سرور قیمت فعال همان پلن را از تنظیمات/دیتابیس می‌خواند.</p></li>
                <li><span>۳</span><p>تخفیف معتبر، مالیات یا اعتبار احتمالی روی سرور محاسبه می‌شود.</p></li>
                <li><span>۴</span><p>Invoice ساخته می‌شود و مبلغ همان فاکتور به درگاه ارسال می‌شود.</p></li>
                <li><span>۵</span><p>بعد از Callback، تراکنش دوباره Verify و سپس اشتراک فعال می‌شود.</p></li>
              </ol>
            </section>

            <section className="dashboard-panel glass-panel">
              <div className="panel-heading">
                <div><span className="section-kicker">سوابق</span><h2>فاکتورها و پرداخت‌ها</h2></div>
                <ReceiptText size={20} />
              </div>
              <div className="dashboard-empty-state">
                <ReceiptText size={22} />
                <strong>هنوز فاکتوری ندارید</strong>
                <small>پس از فعال‌شدن پلن‌های پولی، فاکتورها و وضعیت پرداخت در این قسمت نمایش داده می‌شوند.</small>
              </div>
            </section>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

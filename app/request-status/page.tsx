import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CustomerRequestStatus from "@/components/CustomerRequestStatus";

export const metadata: Metadata = {
  title: "پیگیری درخواست قیمت",
  description: "پیگیری خصوصی درخواست قیمت و مشاهده پاسخ کسب‌وکار با کد درخواست و شماره همراه.",
  robots: { index: false, follow: false },
};

export default async function RequestStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const params = await searchParams;
  return (
    <main>
      <Header />
      <section className="inner-page request-status-page">
        <div className="shell request-status-page-shell">
          <div className="page-heading">
            <span className="section-kicker">پیگیری درخواست</span>
            <h1>پاسخ کسب‌وکار را خصوصی ببین.</h1>
            <p>
              مبلغ و توضیح پیشنهادی فقط با کد درخواست و شماره همراه همان مشتری قابل مشاهده است.
            </p>
          </div>
          <CustomerRequestStatus initialCode={params.code || ""} />
        </div>
      </section>
      <Footer />
    </main>
  );
}

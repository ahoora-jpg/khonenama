import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AdminBilling from "@/components/AdminBilling";
import AdminPayments from "@/components/AdminPayments";
export default function Page() { return <main><Header /><section className="inner-page dashboard-page"><div className="shell"><h1>اشتراک و پرداخت</h1><AdminBilling /><AdminPayments /></div></section><Footer /></main>; }

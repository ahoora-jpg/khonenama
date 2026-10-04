import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AdminBusinessModeration from "@/components/AdminBusinessModeration";
import AdminLaunchOffer from "@/components/AdminLaunchOffer";
import AdminPayments from "@/components/AdminPayments";
import AdminTaxonomySuggestions from "@/components/AdminTaxonomySuggestions";

export const metadata: Metadata = {
  title: "مدیریت کسب‌وکارها | خونه نما",
  robots: { index: false, follow: false },
};

export default function AdminBusinessesPage() {
  return (
    <main>
      <Header />
      <section className="inner-page dashboard-page">
        <div className="shell">
          <AdminBusinessModeration />
          <AdminTaxonomySuggestions />
          <AdminLaunchOffer />
          <AdminPayments />
        </div>
      </section>
      <Footer />
    </main>
  );
}

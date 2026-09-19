import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BusinessProfileEditor from "@/components/BusinessProfileEditor";

export const metadata: Metadata = {
  title: "ویرایش پروفایل کسب‌وکار | خونه‌نما",
  robots: { index: false, follow: false },
};

export default function DashboardProfilePage() {
  return (
    <main>
      <Header />
      <section className="inner-page dashboard-page">
        <div className="shell">
          <BusinessProfileEditor />
        </div>
      </section>
      <Footer />
    </main>
  );
}

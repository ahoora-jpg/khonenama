import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AdminBusinessModeration from "@/components/AdminBusinessModeration";

export const metadata: Metadata = {
  title: "مدیریت کسب‌وکارها | خونه‌نما",
  robots: { index: false, follow: false },
};

export default function AdminBusinessesPage() {
  return (
    <main>
      <Header />
      <section className="inner-page dashboard-page">
        <div className="shell">
          <AdminBusinessModeration />
        </div>
      </section>
      <Footer />
    </main>
  );
}

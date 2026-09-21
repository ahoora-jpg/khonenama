import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AdminReviewModeration from "@/components/AdminReviewModeration";

export const metadata: Metadata = {
  title: "مدیریت نظرها | خونه‌نما",
  robots: { index: false, follow: false },
};

export default function AdminReviewsPage() {
  return (
    <main>
      <Header />
      <section className="inner-page dashboard-page">
        <div className="shell">
          <AdminReviewModeration />
        </div>
      </section>
      <Footer />
    </main>
  );
}

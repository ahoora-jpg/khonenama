import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BusinessDashboardContent from "@/components/BusinessDashboardContent";

export const metadata: Metadata = {
  title: "پنل مدیریت کسب‌وکار",
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return (
    <main>
      <Header />
      <section className="inner-page dashboard-page business-dashboard-page">
        <div className="shell">
          <BusinessDashboardContent />
        </div>
      </section>
      <Footer />
    </main>
  );
}

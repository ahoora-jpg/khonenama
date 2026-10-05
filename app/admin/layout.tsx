import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <><nav className="shell"><a href="/admin/businesses">غرفه‌ها</a> · <a href="/admin/reviews">نظرها</a> · <a href="/admin/support">گزارش‌ها و پشتیبانی</a> · <a href="/admin/campaigns">جشنواره‌ها</a> · <a href="/admin/billing">اشتراک و پرداخت</a></nav>{children}</>;
}

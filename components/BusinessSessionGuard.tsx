"use client";

import { useEffect, useState } from "react";

export default function BusinessSessionGuard({
  children,
  nextPath,
}: {
  children: React.ReactNode;
  nextPath: string;
}) {
  const [ready, setReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const response = await fetch("/api/me/business", { cache: "no-store" });
        if (response.status === 401) {
          window.location.replace("/business/login?next=" + encodeURIComponent(nextPath));
          return;
        }
        if (!response.ok) {
          if (!cancelled) setUnavailable(true);
          return;
        }
        if (!cancelled) setReady(true);
      } catch {
        if (!cancelled) setUnavailable(true);
      }
    }

    checkSession();
    return () => {
      cancelled = true;
    };
  }, [nextPath]);

  if (unavailable) {
    return (
      <div className="dashboard-panel glass-panel">
        <strong>ارتباط با پنل موقتاً برقرار نشد.</strong>
        <p>صفحه را دوباره بارگذاری کنید یا از صفحه ورود وارد پنل شوید.</p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="dashboard-panel glass-panel">
        <span>در حال بررسی Session پنل...</span>
      </div>
    );
  }

  return <>{children}</>;
}

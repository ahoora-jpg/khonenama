"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";

export default function BusinessLogoutButton() {
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.getRegistration("/");
        const subscription = await registration?.pushManager.getSubscription();
        if (subscription) {
          const response = await fetch("/api/me/business/web-push", {method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({endpoint:subscription.endpoint})});
          if (response.ok) await subscription.unsubscribe();
        }
      }
    } finally {
      const response=await fetch("/api/auth/logout", { method: "POST" });
      if(!response.ok){setLoading(false);return;}
      localStorage.removeItem("khonenama-business-profile");
      localStorage.removeItem("khonenama-business-draft");
      window.location.href = "/business/login";
    }
  }

  return (
    <button className="dashboard-logout-button" type="button" onClick={logout} disabled={loading}>
      <LogOut size={16} />
      {loading ? "در حال خروج..." : "خروج از پنل"}
    </button>
  );
}

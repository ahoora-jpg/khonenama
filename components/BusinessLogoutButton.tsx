"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";

export default function BusinessLogoutButton() {
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
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

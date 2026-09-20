"use client";

import { useEffect, useState } from "react";
import { Check, Crown, Sparkles } from "lucide-react";
import { businessPlans } from "@/lib/business-plans";

export default function BusinessPlanCards() {
  const [currentPlan, setCurrentPlan] = useState("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me/business", { cache: "no-store" })
      .then((response) => response.json())
      .then((result) => {
        if (!cancelled && result?.ok) {
          setCurrentPlan(result.business?.plan?.code || "free");
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="business-plan-grid billing-plan-grid">
      {businessPlans.map((plan) => {
        const active = currentPlan === plan.code;
        return (
          <article
            className={
              "business-plan-card " +
              (plan.code === "pro" ? "is-highlighted " : "") +
              (active ? "is-current-plan " : "") +
              "plan-card-" + plan.code
            }
            key={plan.code}
          >
            <span className="business-plan-badge">
              {plan.code === "premium" && <Crown size={13} />}
              {plan.code === "pro" && <Sparkles size={13} />}
              {plan.badge}
            </span>
            <h2>{plan.name}</h2>
            <strong>{plan.priceLabel}</strong>
            <p>{plan.description}</p>
            <ul>
              {plan.features.map((feature) => <li key={feature}><Check size={15} /> {feature}</li>)}
            </ul>
            {active ? (
              <span className="billing-current-plan"><Check size={14} /> {loading ? "در حال بررسی..." : "پلن فعلی"}</span>
            ) : plan.code === "free" ? (
              <span className="billing-plan-note">امکان بازگشت به پایه از پنل پشتیبانی</span>
            ) : (
              <button className="pill-button billing-disabled" type="button" disabled>
                <Sparkles size={15} /> فعال‌سازی پس از تعیین قیمت
              </button>
            )}
          </article>
        );
      })}
    </div>
  );
}

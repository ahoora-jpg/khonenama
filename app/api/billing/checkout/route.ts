import { getBusinessPlan } from "@/lib/business-plans";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const planCode = typeof body?.planCode === "string" ? body.planCode : "";
  const plan = getBusinessPlan(planCode);

  if (!plan) {
    return Response.json({ ok: false, error: "PLAN_NOT_FOUND" }, { status: 404 });
  }

  if (plan.code === "free") {
    return Response.json(
      { ok: false, error: "FREE_PLAN_DOES_NOT_REQUIRE_PAYMENT" },
      { status: 409 }
    );
  }

  if (plan.amountToman === null || !plan.purchasable) {
    return Response.json(
      { ok: false, error: "PLAN_PRICING_NOT_ACTIVE" },
      { status: 409 }
    );
  }

  return Response.json(
    {
      ok: false,
      error: "PAYMENT_PROVIDER_NOT_CONFIGURED",
      message:
        "Checkout is intentionally disabled until the production payment provider, merchant credentials, D1 binding and server-side session are configured.",
    },
    { status: 503 }
  );
}

import { getBusinessPlan } from "@/lib/business-plans";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const planCode = typeof body?.planCode === "string" ? body.planCode : "";
  const plan = getBusinessPlan(planCode);

  if (!plan) {
    return Response.json({ ok: false, error: "PLAN_NOT_FOUND" }, { status: 404 });
  }

  if (plan.amountToman === null) {
    return Response.json(
      {
        ok: false,
        error: "PLAN_PRICING_NOT_ACTIVE",
        plan: { code: plan.code, name: plan.name, priceLabel: plan.priceLabel },
      },
      { status: 409 }
    );
  }

  const subtotal = plan.amountToman;
  const discount = 0;
  const tax = 0;
  const total = subtotal - discount + tax;

  return Response.json({
    ok: true,
    currency: "IRT",
    plan: { code: plan.code, name: plan.name },
    amounts: { subtotal, discount, tax, total },
  });
}

import { imageKitConfigured } from "@/lib/server/imagekit";

export async function GET() {
  const configured = imageKitConfigured();

  return Response.json(
    {
      ok: configured,
      provider: "imagekit",
      configured,
    },
    {
      status: configured ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

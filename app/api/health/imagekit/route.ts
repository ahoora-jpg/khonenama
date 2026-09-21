import { getImageKitConfig } from "@/lib/server/imagekit";

export async function GET() {
  const config = getImageKitConfig();
  const presence = {
    publicKey: Boolean(config.publicKey),
    privateKey: Boolean(config.privateKey),
    urlEndpoint: Boolean(config.urlEndpoint),
  };
  const configured = presence.privateKey && presence.urlEndpoint;

  return Response.json(
    {
      ok: configured,
      provider: "imagekit",
      configured,
      uploadMode: "server",
      clientUploadAvailable: presence.publicKey,
      presence,
    },
    {
      status: configured ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

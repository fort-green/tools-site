// Guest pass QR image for guest-list emails and the /guest/ pass page.
// GET ?t=<guest token uuid> returns a PNG QR code of "FGG:<token>". Public (images in emails can't send a sign-in);
// it only encodes the token it's given and reads no data.
import QRCode from "npm:qrcode@1.5.4";

Deno.serve(async (req) => {
  const t = new URL(req.url).searchParams.get("t") || "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(t)) return new Response("Bad token", { status: 400 });
  const png = await QRCode.toBuffer("FGG:" + t.toUpperCase(), { type: "png", width: 480, margin: 2, errorCorrectionLevel: "M" });
  return new Response(png, { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=31536000, immutable", "Access-Control-Allow-Origin": "*" } });
});

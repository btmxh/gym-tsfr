import { auth } from "@/lib/auth";
import Elysia from "elysia";
import { unauthorized } from "./perms";
import { createHmac, randomBytes } from "crypto";
import { QRCODE_TIMEOUT, QRPayload, QRSigner } from "@/lib/qr";

const qrSigner = await QRSigner.fromSecret(process.env.QR_SIGNING_SECRET!);

export const eventsRouter = new Elysia({ prefix: "/events" }).get(
  "/qrcode",
  async ({ request: { headers }, status, set }) => {
    set.headers["Cache-Control"] = "no-store";

    const session = await auth.api.getSession({ headers });
    if (!session) return unauthorized(status);
    const token = qrSigner.generateToken(session.user.id);
    return {
      url: `https://gymembrace.app/checkin?token=${token}`,
    };
  },
);

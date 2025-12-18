import { auth } from "@/lib/auth";
import Elysia from "elysia";
import { checkPerm, unauthorized } from "./perms";
import { createHmac, randomBytes } from "crypto";
import { QRCODE_TIMEOUT, QRPayload, QRSigner } from "@/lib/qr";
import z from "zod";
import { db } from "@/lib/db";

const qrSigner = await QRSigner.fromPrivateKey(
  process.env.QR_SIGNING_PRIVATE_KEY!,
  process.env.NEXT_PUBLIC_QR_SIGNING_PUBLIC_KEY!,
);

export const eventsRouter = new Elysia({ prefix: "/events" })
  .get("/qrcode", async ({ request: { headers }, status, set }) => {
    set.headers["Cache-Control"] = "no-store";

    const session = await auth.api.getSession({ headers });
    if (!session) return unauthorized(status);
    const url = await qrSigner.generateUrl(
      session,
      "https://gymembrace.app/qr",
    );
    return { url };
  })
  .post(
    "/new",
    async ({ body: { mode, url }, status, request: { headers } }) => {
      await checkPerm(headers, status, { events: ["create"] });
      try {
        const { userId } = await qrSigner.verifyUrl(url);
        const res = await db.collection("events").insertOne({
          userId,
          mode,
          createdAt: new Date(),
        });
        return { docId: res.insertedId };
      } catch (err) {
        return status(400, { message: `${err}` });
      }
    },
    {
      body: z.object({
        mode: z.enum(["check-in", "check-out"]),
        url: z.string().min(1),
      }),
    },
  );

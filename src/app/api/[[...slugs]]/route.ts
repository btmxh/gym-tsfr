import { redis } from "@/lib/redis";
import Elysia, { t } from "elysia";
import { z } from "zod";
import { nanoid } from "nanoid";
import { authMiddleware } from "./auth";
import { Message, realtime } from "@/lib/realtime";

const ROOM_TTL = 60 * 10; // 10 minutes in seconds

const rooms = new Elysia({ prefix: "/rooms" })
  .post("/create", async () => {
    const roomId = nanoid();

    await redis.hset(`meta:${roomId}`, {
      connected: [],
      createdAt: Date.now(),
    });

    await redis.expire(`meta:${roomId}`, ROOM_TTL);

    return { roomId };
  })
  .use(authMiddleware)
  .get("/ttl", async ({ auth: { roomId } }) => {
    const ttl = Math.max(0, await redis.ttl(`meta:${roomId}`));
    return { ttl };
  })
  .delete("/", async ({ auth: { roomId } }) => {
    await Promise.all([
      redis.del(roomId),
      redis.del(`meta:${roomId}`),
      redis.del(`messages:${roomId}`),
    ]);

    await realtime.channel(roomId).emit("chat.destroy", { isDestroyed: true });
  });

const messages = new Elysia({ prefix: "/messages" })
  .use(authMiddleware)
  .post(
    "/",
    async ({ body, auth: { token, roomId } }) => {
      const { sender, text } = body;
      const roomExists = await redis.exists(`meta:${roomId}`);
      if (!roomExists) {
        throw new Error("Room does not exist");
      }

      const message = {
        id: nanoid(),
        sender,
        text,
        timestamp: Date.now(),
        roomId,
      } satisfies Message;

      await redis.rpush(`messages:${roomId}`, {
        ...message,
        token: token,
      });
      await realtime.channel(roomId).emit(`chat.message`, message);

      const remaining = await redis.ttl(`meta:${roomId}`);
      await redis.expire(`messages:${roomId}`, remaining);
      await redis.expire(roomId, remaining);
    },
    {
      query: z.object({ roomId: z.string() }),
      body: z.object({
        sender: z.string().max(100),
        text: z.string().max(1000),
      }),
    },
  )
  .get(
    "/",
    async ({ query: { roomId }, auth: { token } }) => {
      const messages = await redis.lrange<Message>(`messages:${roomId}`, 0, -1);

      return {
        messages: messages.map(({ token: msgToken, ...msg }) => ({
          ...msg,
          token: msgToken === token ? token : undefined,
        })),
      };
    },
    {
      query: z.object({ roomId: z.string() }),
    },
  );

const app = new Elysia({ prefix: "/api" })
  .use(rooms)
  .use(messages)
  .get("/", "Diddy Yamal")
  .post("/", ({ body }) => body, {
    body: t.Object({
      name: t.String(),
    }),
  });

export type App = typeof app;

export const GET = app.fetch;
export const POST = app.fetch;
export const DELETE = app.fetch;

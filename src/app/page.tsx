"use client";

import { useUsername } from "@/hooks/use-username";
import { api } from "@/lib/client";
import { useMutation } from "@tanstack/react-query";
import { nanoid } from "nanoid";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useEffectEvent, useState } from "react";

export default function Home() {
  const router = useRouter();

  const searchParams = useSearchParams();
  const wasDestroyed = searchParams.get("destroy") === "true";
  const error = searchParams.get("error");

  const { mutate: createRoom } = useMutation({
    mutationFn: async () => {
      const res = await api.rooms.create.post();

      if (res.status === 200) {
        router.push(`/room/${res.data?.roomId}`);
      }
    },
  });

  const { username } = useUsername();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {wasDestroyed && (
          <div className="bg-red-950/50 border border-red-900 p-4 text-center">
            <p className="text-red-500 text-sm font-bold">ROOM DESTROYED</p>
            <p className="text-neutral-500 text-xs mt-1">
              All messages are permanently deleted.
            </p>
          </div>
        )}

        {error === "room-not-found" && (
          <div className="bg-red-950/50 border border-red-900 p-4 text-center">
            <p className="text-red-500 text-sm font-bold">ROOM NOT FOUND</p>
            <p className="text-neutral-500 text-xs mt-1">
              This room either does not exist or has already been destroyed.
            </p>
          </div>
        )}

        {error === "room-full" && (
          <div className="bg-red-950/50 border border-red-900 p-4 text-center">
            <p className="text-red-500 text-sm font-bold">ROOM FULL</p>
            <p className="text-neutral-500 text-xs mt-1">
              This room already has two participants.
            </p>
          </div>
        )}

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-green-500">
            {">"}private_chat
          </h1>
          <p className="text-neutral-500 text-sm">
            A private, self-destructing chat room.
          </p>
        </div>

        <div className="border border-neutral-800 bg-neutral-900/50 p-6 backdrop-blur-md">
          <div className="space-y-5">
            <div className="space-y-2">
              Create room
              <label className="flex items-center text-neutral-500">
                Your identity
              </label>
              <div className="flex item-center gap-3">
                <div className="flex-1 bg-neutral-950 border border-neutral-800 p-3 text-sm text-neutral-400 font-mono">
                  {username}
                </div>
              </div>
              <button
                onClick={() => createRoom()}
                className="w-full bg-neutral-100 text-black p-3 text-sm font-bold hover:bg-neutral-500 hover:text-black transition-colors mt-2 cursor-pointer disabled:opacity-50"
              >
                Create Secure Room
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

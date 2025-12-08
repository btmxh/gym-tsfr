"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/client";
import { useUsername } from "@/hooks/use-username";
import { format } from "date-fns";
import { useRealtime } from "@/lib/realtime-client";

const formatTimeRemaining = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const Page = () => {
  const params = useParams();
  const roomId = params.roomId as string;

  const [copyStatus, setCopyStatus] = useState<"COPY" | "COPIED">("COPY");
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { username } = useUsername();
  const router = useRouter();

  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: async ({ text }: { text: string }) => {
      await api.messages.post(
        { sender: username, text },
        { query: { roomId } },
      );
      setInput("");
    },
  });

  const { mutate: destroyRoom } = useMutation({
    mutationFn: async () => {
      await api.rooms.delete(null, { query: { roomId } });
    },
  });

  const { data: messages, refetch } = useQuery({
    queryKey: ["messages", roomId],
    queryFn: async () => {
      const res = await api.messages.get({ query: { roomId } });
      return res.data;
    },
  });

  const { data: ttl } = useQuery({
    queryKey: ["ttl", roomId],
    queryFn: async () => {
      const res = await api.rooms.ttl.get({ query: { roomId } });
      return res.data;
    },
  });

  useEffect(() => {
    if (ttl?.ttl !== undefined) {
      setTimeRemaining(ttl.ttl);
    }
  }, [ttl]);

  useEffect(() => {
    if (timeRemaining === null || timeRemaining < 0) return;
    if (timeRemaining == 0) {
      router.push("/?destroy=true");
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining, router]);

  useRealtime({
    channels: [roomId],
    events: ["chat.message", "chat.destroy"],
    onData: ({ event }) => {
      if (event === "chat.message") {
        refetch();
      }

      if (event === "chat.destroy") {
        router.push("/?destroy=true");
      }
    },
  });

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopyStatus("COPIED");
    setTimeout(() => setCopyStatus("COPY"), 2000);
  };

  return (
    <main className="flex flex-col min-h-screen max-h-screen overflow-hidden">
      <header className="border-b border-neutral-800 p-4 flex items-center justify-between bg-neutral-900/30">
        <div className="flex flex-center gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-neutral-500 uppercase">Room ID</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-green-500">{roomId}</span>
              <button
                onClick={() => copyLink()}
                className="text-[10px] bg-neutral-800 hover:bg-neutral-700 text-neutral-400 py-0.5 px-2 rounded hover:text-neutral-200 transition-colors"
              >
                {copyStatus}
              </button>
            </div>
          </div>

          <div className="h-8 w-px bg-neutral-800"></div>

          <div className="flex flex-col">
            <span className="text-xs text-neutral-500 uppercase">
              Self-Destruct
            </span>
            <span
              className={`text-sm font-bold flex items-center gap-2 ${timeRemaining !== null && timeRemaining <= 60 ? "text-red-500" : "text-amber-500"}`}
            >
              {timeRemaining !== null
                ? `${formatTimeRemaining(timeRemaining)}`
                : "N/A"}
            </span>
          </div>
        </div>

        <button
          onClick={() => destroyRoom()}
          className="text-xs bg-neutral-800 hover:bg-red-600 px-3 py-1.5 rounded text-neutral 400 hover:text-white font-bold transition-all group flex items-center gap-2 disabled:opacity-50"
        >
          <span className="group-hover:animate-pulse">💣 DESTROY NOW</span>
        </button>
      </header>

      <div className="flex flex-col flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages?.messages?.length === 0 && (
          <div className="flex flex-1 justify-center items-center">
            <p className="text-sm text-neutral-600 font-mono">
              No messages yet, start the conversation.
            </p>
          </div>
        )}

        {messages?.messages.map((msg) => {
          return (
            <div key={msg.id} className="flex flex-col items-start">
              <div className="max-w-[80%] group">
                <div className="flex items-baseline gap-3 mb-1">
                  <span
                    className={`text-xs ${msg.sender === username ? "text-green-200" : "text-blue-200"}`}
                  >
                    {msg.sender === username ? "You" : msg.sender}
                  </span>

                  <span className="text-neutral-600 text-[10px]">
                    {format(msg.timestamp, "HH:mm")}
                  </span>

                  <p className="text-neutral-300 text-sm leading-relaxed break-all">
                    {msg.text}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t border-neutral-800 bg-neutral-900/30">
        <div className="flex gap-4">
          <div className="flex-1 relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500 animate-pulse">
              {">"}
            </span>
            <input
              autoFocus
              type="text"
              value={input}
              onKeyDown={(e) => {
                if (e.key === "Enter" && input.trim()) {
                  sendMessage({ text: input });
                  inputRef.current?.focus();
                }
              }}
              placeholder="Type your message..."
              onChange={(e) => setInput(e.target.value)}
              className="w-full bg-black border border-neutral-800 focus:border neutral-700 focus:outline-none transition-colors text-neutral-100 placeholder:text-neutral-700 py-3 pl-8 pr-4 text-sm"
            />
          </div>

          <button
            onClick={() => {
              sendMessage({ text: input });
              inputRef.current?.focus();
            }}
            disabled={!input.trim() || isPending}
            className="bg-neutral-800 text-neutral-400 px-6 text-sm font-bold hover:text-neutral-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            SEND
          </button>
        </div>
      </div>
    </main>
  );
};

export default Page;

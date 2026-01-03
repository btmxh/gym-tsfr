"use client";

import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import TrainerProfileForm from "@/components/trainers/TrainerProfileForm";
import { useEffect } from "react";

export default function TrainerProfilePage() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  useEffect(() => {
    if (isPending) return;
    if (session === null) {
      router.push("/auth/login");
      return;
    }
    if (session.user.role !== "coach" && session.user.role !== "admin") {
      router.push("/");
    }
  }, [isPending, session, router]);

  if (isPending) {
    return (
      <main className="container mx-auto p-6 max-w-4xl">
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </main>
    );
  }

  if (session === null) return null;
  if (session.user.role !== "coach" && session.user.role !== "admin") return null;

  return (
    <main className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">My Trainer Profile</h1>
        <p className="text-base-content/70 mt-2">
          Create or update your trainer profile to be visible to members
        </p>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <TrainerProfileForm onSuccess={() => router.push("/trainers")} />
        </div>
      </div>
    </main>
  );
}

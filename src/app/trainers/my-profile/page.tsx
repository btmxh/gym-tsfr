"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/eden";
import TrainerProfileForm from "@/components/trainers/TrainerProfileForm";
import { useRouter } from "next/navigation";

export default function MyTrainerProfilePage() {
  const router = useRouter();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["trainer-profile", "me"],
    queryFn: async () => {
      const response = await api.trainers.profile.me.get();
      if (response.error) {
        // If 404, user doesn't have a profile yet
        if (response.status === 404) return null;
        throw new Error(response.error.value as string);
      }
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          {profile ? "Edit Trainer Profile" : "Create Trainer Profile"}
        </h1>
        <p className="text-base-content/70">
          {profile
            ? "Update your trainer profile information"
            : "Create your trainer profile to start accepting clients"}
        </p>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <TrainerProfileForm
            onSuccess={() => {
              // Redirect to trainers page after success
              setTimeout(() => {
                router.push("/trainers");
              }, 1000);
            }}
          />
        </div>
      </div>
    </div>
  );
}

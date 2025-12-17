"use client";

import { api } from "@/lib/eden";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { CheckIcon } from "@heroicons/react/24/solid";
import { PackageDuration } from "@/lib/gym/package";

function PricingCard({
  duration,
  price,
  features,
  isPopular = false,
}: {
  duration: PackageDuration;
  price: number;
  features: string[];
  isPopular?: boolean;
}) {
  const t = useTranslations("Membership");

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <div
      className={`card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 ${
        isPopular ? "border-2 border-primary scale-105" : ""
      }`}
    >
      {isPopular && (
        <div className="badge badge-primary absolute -top-3 left-1/2 -translate-x-1/2">
          {t("popular")}
        </div>
      )}
      <div className="card-body">
        <h2 className="card-title text-2xl justify-center">
          {t(`durations.${duration}`)}
        </h2>
        <div className="text-center my-4">
          <p className="text-4xl font-bold text-primary">
            {formatPrice(price)}
          </p>
          <p className="text-sm text-base-content/60 mt-1">
            {t("perPeriod", { period: t(`durations.${duration}`) })}
          </p>
        </div>

        <div className="divider"></div>

        <ul className="space-y-3 flex-grow">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <CheckIcon className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
              <span className="text-sm">{t(`features.${feature}`)}</span>
            </li>
          ))}
        </ul>

        <div className="card-actions justify-center mt-6">
          <button
            className={`btn ${isPopular ? "btn-primary" : "btn-outline btn-primary"} w-full`}
          >
            {t("choosePlan")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MembershipsPage() {
  const t = useTranslations("Membership");

  const { data: packages, isLoading, error } = useQuery({
    queryKey: ["packages"],
    queryFn: async () => {
      const res = await api.packages.list.get();
      if (res.status === 200) {
        return res.data;
      }
      throw new Error("Failed to fetch packages");
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="alert alert-error max-w-md">
          <span>{t("errorLoading")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          {t("title")}
        </h1>
        <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {packages?.map((pkg) => (
          <PricingCard
            key={pkg.packageId}
            duration={pkg.duration}
            price={pkg.price}
            features={pkg.features}
            isPopular={pkg.duration === "3-months"}
          />
        ))}
      </div>

      <div className="mt-16 text-center">
        <div className="alert alert-info max-w-2xl mx-auto">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="stroke-current shrink-0 w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <span>{t("contactInfo")}</span>
        </div>
      </div>
    </div>
  );
}
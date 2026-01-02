"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/eden";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { packageDurations } from "@/lib/gym/package";
import { useState } from "react";
import { useToast } from "../toast-context";

const packageSchema = z.object({
  duration: z.enum(packageDurations),
  price: z.number().min(0, "Price must be positive"),
  currency: z.string(),
  isActive: z.boolean(),
  features: z.string().min(1, "Features are required"),
});

type PackageFormData = z.infer<typeof packageSchema>;

interface CreatePackageFormProps {
  onSuccess: () => void;
}

export default function CreatePackageForm({ onSuccess }: CreatePackageFormProps) {
  const t = useTranslations("PackageManagement");
  const tMembership = useTranslations("Membership");
  const queryClient = useQueryClient();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PackageFormData>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      duration: "1-month",
      currency: "VND",
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: PackageFormData) => {
      const featuresArray = data.features
        .split("\n")
        .map((f) => f.trim())
        .filter((f) => f.length > 0);

      const res = await api.packages.create.post({
        duration: data.duration,
        price: data.price,
        currency: data.currency,
        isActive: data.isActive,
        features: featuresArray,
      });

      if (res.status !== 200) {
        throw new Error("Failed to create package");
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      toast({ message: t("createSuccess"), type: "success" });
      onSuccess();
    },
    onError: () => {
      toast({ message: t("createError"), type: "error" });
    },
  });

  const onSubmit = (data: PackageFormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="card bg-base-100">
      <div className="card-body">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Duration */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">{t("duration")}</span>
            </label>
            <select
              className={`select select-bordered ${errors.duration ? "select-error" : ""}`}
              {...register("duration")}
            >
              {packageDurations.map((duration) => (
                <option key={duration} value={duration}>
                  {tMembership(`durations.${duration}`)}
                </option>
              ))}
            </select>
            {errors.duration && (
              <label className="label">
                <span className="label-text-alt text-error">
                  {errors.duration.message}
                </span>
              </label>
            )}
          </div>

          {/* Price */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">{t("price")}</span>
            </label>
            <input
              type="number"
              placeholder="500000"
              className={`input input-bordered ${errors.price ? "input-error" : ""}`}
              {...register("price", { valueAsNumber: true })}
            />
            {errors.price && (
              <label className="label">
                <span className="label-text-alt text-error">
                  {errors.price.message}
                </span>
              </label>
            )}
          </div>

          {/* Currency */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">{t("currency")}</span>
            </label>
            <input
              type="text"
              className="input input-bordered"
              {...register("currency")}
              disabled
            />
          </div>

          {/* Features */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">{t("features")}</span>
              <span className="label-text-alt">{t("featuresHint")}</span>
            </label>
            <textarea
              className={`textarea textarea-bordered h-32 ${errors.features ? "textarea-error" : ""}`}
              placeholder="access_all_facilities&#10;basic_equipment&#10;locker_room"
              {...register("features")}
            />
            {errors.features && (
              <label className="label">
                <span className="label-text-alt text-error">
                  {errors.features.message}
                </span>
              </label>
            )}
          </div>

          {/* Active Status */}
          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-4">
              <input
                type="checkbox"
                className="checkbox checkbox-primary"
                {...register("isActive")}
              />
              <span className="label-text">{t("isActive")}</span>
            </label>
          </div>

          {/* Actions */}
          <div className="card-actions justify-end mt-6">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onSuccess}
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <span className="loading loading-spinner"></span>
                  {t("creating")}
                </>
              ) : (
                t("create")
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

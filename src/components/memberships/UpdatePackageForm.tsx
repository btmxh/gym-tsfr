"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/eden";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PackageWithId, packageDurations } from "@/lib/gym/package";
import { useToast } from "../toast-context";

const packageSchema = z.object({
  price: z.number().min(0, "Price must be positive"),
  isActive: z.boolean(),
  features: z.string().min(1, "Features are required"),
});

type PackageFormData = z.infer<typeof packageSchema>;

interface UpdatePackageFormProps {
  package: PackageWithId;
  onSuccess: () => void;
}

export default function UpdatePackageForm({ 
  package: pkg, 
  onSuccess 
}: UpdatePackageFormProps) {
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
      price: pkg.price,
      isActive: pkg.isActive,
      features: pkg.features.join("\n"),
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: PackageFormData) => {
      const featuresArray = data.features
        .split("\n")
        .map((f) => f.trim())
        .filter((f) => f.length > 0);

      const res = await api.packages({ id: pkg._id }).patch({
        price: data.price,
        isActive: data.isActive,
        features: featuresArray,
      });

      if (res.status !== 200) {
        throw new Error("Failed to update package");
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      toast({ message: t("updateSuccess"), type: "success" });
      onSuccess();
    },
    onError: () => {
      toast({ message: t("updateError"), type: "error" });
    },
  });

  const onSubmit = (data: PackageFormData) => {
    updateMutation.mutate(data);
  };

  return (
    <div className="card bg-base-100">
      <div className="card-body">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Duration (Read-only) */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">{t("duration")}</span>
            </label>
            <input
              type="text"
              className="input input-bordered"
              value={tMembership(`durations.${pkg.duration}`)}
              disabled
            />
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
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <span className="loading loading-spinner"></span>
                  {t("updating")}
                </>
              ) : (
                t("update")
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

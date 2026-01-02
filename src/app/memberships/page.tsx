"use client";

import { api } from "@/lib/eden";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { CheckIcon, PencilSquareIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/solid";
import { PackageWithId } from "@/lib/gym/package";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import PaymentForm from "@/components/memberships/PaymentForm";
import CreatePackageForm from "@/components/memberships/CreatePackageForm";
import UpdatePackageForm from "@/components/memberships/UpdatePackageForm";
import DeletePackageForm from "@/components/memberships/DeletePackageForm";

function PricingCard({
  package: pkg,
  isPopular = false,
  isAdmin = false,
  onChoosePlan,
  onEdit,
  onDelete,
}: {
  package: PackageWithId;
  isPopular?: boolean;
  isAdmin?: boolean;
  onChoosePlan: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const t = useTranslations("Membership");

  // Debug log
  console.log("PricingCard isAdmin prop:", isAdmin);

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
        {/* Admin Controls */}
        {isAdmin && (
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              className="btn btn-sm btn-ghost btn-circle"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.();
              }}
              title="Edit"
            >
              <PencilSquareIcon className="w-4 h-4" />
            </button>
            <button
              className="btn btn-sm btn-ghost btn-circle text-error"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
              title="Delete"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        <h2 className="card-title text-2xl justify-center">
          {t(`durations.${pkg.duration}`)}
        </h2>
        <div className="text-center my-4">
          <p className="text-4xl font-bold text-primary">
            {formatPrice(pkg.price)}
          </p>
          <p className="text-sm text-base-content/60 mt-1">
            {t("perPeriod", { period: t(`durations.${pkg.duration}`) })}
          </p>
        </div>

        {!pkg.isActive && (
          <div className="badge badge-error badge-sm">{t("inactive")}</div>
        )}

        <div className="divider"></div>

        <ul className="space-y-3 flex-grow">
          {pkg.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <CheckIcon className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
              <span className="text-sm">{t(`features.${feature}`)}</span>
            </li>
          ))}
        </ul>

        <div className="card-actions justify-center mt-6">
          <button
            className={`btn ${isPopular ? "btn-primary" : "btn-outline btn-primary"} w-full`}
            onClick={onChoosePlan}
            disabled={!pkg.isActive}
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
  const tPayment = useTranslations("Payment");
  const tManage = useTranslations("PackageManagement");
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const [selectedPackage, setSelectedPackage] = useState<PackageWithId | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [packageToEdit, setPackageToEdit] = useState<PackageWithId | null>(null);

  const { data: packages, isLoading, error } = useQuery({
    queryKey: ["packages"],
    queryFn: async () => {
      const res = await api.packages.list.get();
      if (res.status === 200) {
        const data = res.data as PackageWithId[];
        // Sort by duration: 1-month, 3-months, 6-months, 1-year
        const durationOrder = { "1-month": 1, "3-months": 2, "6-months": 3, "1-year": 4 };
        return data.sort((a, b) => {
          const orderA = durationOrder[a.duration as keyof typeof durationOrder] || 999;
          const orderB = durationOrder[b.duration as keyof typeof durationOrder] || 999;
          return orderA - orderB;
        });
      }
      throw new Error("Failed to fetch packages");
    },
  });

  const hasAdminPrivilege = session?.user?.role === "admin";
  console.log("Has admin privilege:", hasAdminPrivilege);

  const handleChoosePlan = (pkg: PackageWithId) => {
    if (!session?.user) {
      router.push("/auth/login");
      return;
    }

    setSelectedPackage(pkg);
    setShowPaymentModal(true);
  };

  const handleEdit = (pkg: PackageWithId) => {
    if (!hasAdminPrivilege) {
      console.error("Unauthorized: Admin access required");
      return;
    }
    // console.log("LOL why i got here?");
    setPackageToEdit(pkg);
    setShowUpdateModal(true);
  };

  const handleDelete = (pkg: PackageWithId) => {
    if (!hasAdminPrivilege) {
      console.error("Unauthorized: Admin access required");
      return;
    }
    setPackageToEdit(pkg);
    setShowDeleteModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setShowSuccessModal(true);
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setSelectedPackage(null);
    router.push("/dashboard");
  };

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
    <>
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-4xl md:text-5xl font-bold">
              {t("title")}
            </h1>
            {hasAdminPrivilege && (
              <button
                className="btn btn-primary btn-circle"
                onClick={() => setShowCreateModal(true)}
                title={tManage("createNew")}
              >
                <PlusIcon className="w-6 h-6" />
              </button>
            )}
          </div>
          <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {packages?.map((pkg) => (
            <PricingCard
              key={pkg._id}
              package={pkg}
              isPopular={pkg.duration === "3-months"}
              isAdmin={hasAdminPrivilege}
              onChoosePlan={() => handleChoosePlan(pkg)}
              onEdit={() => handleEdit(pkg)}
              onDelete={() => handleDelete(pkg)}
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

      {/* Create Package Modal */}
      {showCreateModal && hasAdminPrivilege === true && (
        <dialog className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">{tManage("createNew")}</h3>
            <CreatePackageForm
              onSuccess={() => setShowCreateModal(false)}
            />
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setShowCreateModal(false)}>close</button>
          </form>
        </dialog>
      )}

      {/* Update Package Modal */}
      {showUpdateModal && hasAdminPrivilege && packageToEdit && (
        <dialog className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">{tManage("editPackage")}</h3>
            <UpdatePackageForm
              package={packageToEdit}
              onSuccess={() => {
                setShowUpdateModal(false);
                setPackageToEdit(null);
              }}
            />
          </div>
          <form method="dialog" className="modal-backdrop">
            <button
              onClick={() => {
                setShowUpdateModal(false);
                setPackageToEdit(null);
              }}
            >
              close
            </button>
          </form>
        </dialog>
      )}

      {/* Delete Package Modal */}
      {showDeleteModal && hasAdminPrivilege && packageToEdit && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <DeletePackageForm
              package={packageToEdit}
              onClose={() => {
                setShowDeleteModal(false);
                setPackageToEdit(null);
              }}
            />
          </div>
          <form method="dialog" className="modal-backdrop">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setPackageToEdit(null);
              }}
            >
              close
            </button>
          </form>
        </dialog>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedPackage && (
        <dialog className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">{tPayment("title")}</h3>
            <PaymentForm
              packageDuration={selectedPackage.duration}
              packagePrice={selectedPackage.price}
              onClose={() => {
                setShowPaymentModal(false);
                setSelectedPackage(null);
              }}
              onSuccess={handlePaymentSuccess}
            />
          </div>
          <form method="dialog" className="modal-backdrop">
            <button
              onClick={() => {
                setShowPaymentModal(false);
                setSelectedPackage(null);
              }}
            >
              close
            </button>
          </form>
        </dialog>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-success-content"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="font-bold text-2xl mb-2">
                {tPayment("successTitle")}
              </h3>
              <p className="text-base-content/70 mb-6">
                {tPayment("successMessage")}
              </p>
              <button
                className="btn btn-primary"
                onClick={handleCloseSuccessModal}
              >
                {tPayment("goToDashboard")}
              </button>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
}
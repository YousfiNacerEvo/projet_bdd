"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "../../stores/userStore";

export default function RoleGate({ allowedRoles, children, fallback = null }) {
  const router = useRouter();
  const { user, loading } = useUserStore();

  useEffect(() => {
    if (!loading && user) {
      if (!allowedRoles.includes(user.role)) {
        // Rediriger vers overview si non autorisé
        router.push("/dashboard/overview");
      }
    }
  }, [user, loading, allowedRoles, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Non authentifié</p>
        </div>
      </div>
    );
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      fallback || (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Accès refusé</h2>
            <p className="mt-2 text-gray-600">
              Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            </p>
            <button
              onClick={() => router.push("/dashboard/overview")}
              className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Retour au dashboard
            </button>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}


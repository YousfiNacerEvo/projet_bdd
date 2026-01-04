"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "../../../src/stores/userStore";

const redirectByRole = (role, router) => {
  switch (role) {
    case "etudiant":
    case "prof":
      router.replace("/dashboard/mon-planning");
      break;
    case "chef_dept":
      router.replace("/dashboard/conflits");
      break;
    case "admin_examens":
      router.replace("/dashboard/planning/generate");
      break;
    case "doyen":
      router.replace("/dashboard/kpis");
      break;
    default:
      router.replace("/dashboard/overview");
  }
};

export default function DashboardHome() {
  const router = useRouter();
  const { user, loading, fetchUser } = useUserStore();

  useEffect(() => {
    // Attendre que le chargement soit terminé
    if (loading) {
      return;
    }

    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/login");
      return;
    }

    // Si on a un user avec un rôle, rediriger
    if (user && user.role) {
      redirectByRole(user.role, router);
      return;
    }

    // Si pas de user, essayer de charger
    if (!user) {
      fetchUser()
        .then((userData) => {
          if (userData && userData.role) {
            redirectByRole(userData.role, router);
          }
        })
        .catch((error) => {
          console.error("Erreur chargement user:", error);
          router.push("/login");
        });
    }
  }, [router, fetchUser, user, loading]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <p className="mt-4 text-gray-600">Chargement...</p>
      </div>
    </div>
  );
}


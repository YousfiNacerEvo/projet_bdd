"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "../../../src/stores/userStore";
import Sidebar from "../../../src/components/dashboard/Sidebar";
import Header from "../../../src/components/dashboard/Header";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const { user, loading, fetchUser, reset } = useUserStore();

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    const token = localStorage.getItem("auth_token");

    if (!token) {
      router.push("/login");
      return;
    }

    // Charger les données utilisateur
    fetchUser().catch((error) => {
      console.error("Erreur chargement user:", error);
      // Si erreur 401, rediriger vers login
      if (error.message.includes("401") || error.message.includes("Token")) {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
        localStorage.removeItem("userMeta");
        reset();
        router.push("/login");
      }
    });
  }, [router, fetchUser, reset]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user && !loading) {
    // Pas d'utilisateur et pas en chargement = redirection en cours
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Redirection...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // En chargement
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar role={user.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}


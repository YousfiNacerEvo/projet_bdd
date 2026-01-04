"use client";
import { useRouter } from "next/navigation";
import { useUserStore } from "../../stores/userStore";

const roleLabels = {
  'etudiant': 'Étudiant',
  'prof': 'Professeur',
  'doyen': 'Doyen',
  'chef_dept': 'Chef de Département',
  'admin_examens': 'Admin Examens'
};

export default function Header() {
  const router = useRouter();
  const { user, reset } = useUserStore();

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      
      await fetch("http://localhost:4001/api/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.error("Erreur déconnexion:", err);
    } finally {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      localStorage.removeItem("userMeta");
      reset();
      router.push("/login");
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-gray-900">
          Plateforme d'Optimisation des EDT
        </h1>
      </div>
      
      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {roleLabels[user.role] || user.role}
              </p>
              {user.dept_id && (
                <p className="text-xs text-gray-500">Dépt. {user.dept_id}</p>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Déconnexion
            </button>
          </div>
        )}
      </div>
    </header>
  );
}


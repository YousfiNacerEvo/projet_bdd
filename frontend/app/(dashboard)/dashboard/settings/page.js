"use client";
import { useUserStore } from "../../../../src/stores/userStore";

export default function SettingsPage() {
  const { user } = useUserStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gérez vos préférences et votre profil
        </p>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations du compte</h2>
        {user && (
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Rôle</p>
              <p className="text-base font-medium text-gray-900">{user.role}</p>
            </div>
            {user.dept_id && (
              <div>
                <p className="text-sm text-gray-500">Département ID</p>
                <p className="text-base font-medium text-gray-900">{user.dept_id}</p>
              </div>
            )}
            {user.formation_id && (
              <div>
                <p className="text-sm text-gray-500">Formation ID</p>
                <p className="text-base font-medium text-gray-900">{user.formation_id}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


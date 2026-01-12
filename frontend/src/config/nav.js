// Configuration de navigation basée sur les rôles
import {
  ChartBarIcon,
  CalendarDaysIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  ChartPieIcon,
  CheckCircleIcon,
  CogIcon,
  ClipboardDocumentListIcon,
  BuildingOffice2Icon,
  BookOpenIcon
} from "@heroicons/react/24/outline";

export const NAV_ITEMS = [
  // Pages communes
  {
    label: "Vue d'ensemble",
    href: "/dashboard/overview",
    group: "principal",
    roles: ["chef_dept", "admin_examens", "doyen"],
    icon: ChartBarIcon
  },
  {
    label: "Mon planning",
    href: "/dashboard/mon-planning",
    group: "principal",
    roles: ["etudiant", "prof"],
    icon: CalendarDaysIcon
  },
  {
    label: "Surveillance",
    href: "/dashboard/surveillance",
    group: "principal",
    roles: ["prof"],
    icon: EyeIcon
  },
  // Chef de département
  {
    label: "Conflits",
    href: "/dashboard/conflits",
    group: "departement",
    roles: ["chef_dept", "admin_examens", "doyen"],
    icon: ExclamationTriangleIcon
  },
  {
    label: "KPIs",
    href: "/dashboard/kpis",
    group: "departement",
    roles: ["chef_dept", "doyen", "admin_examens"],
    icon: ChartPieIcon
  },
  {
    label: "Validation",
    href: "/dashboard/validation",
    group: "departement",
    roles: ["chef_dept", "doyen"],
    icon: CheckCircleIcon
  },
  // Admin examens
  {
    label: "Générer planning",
    href: "/dashboard/planning/generate",
    group: "planning",
    roles: ["admin_examens"],
    icon: CogIcon
  },
  {
    label: "Historique",
    href: "/dashboard/planning/runs",
    group: "planning",
    roles: ["admin_examens"],
    icon: ClipboardDocumentListIcon
  },
  {
    label: "Salles",
    href: "/dashboard/ressources/salles",
    group: "ressources",
    roles: ["admin_examens"],
    icon: BuildingOffice2Icon
  },
  {
    label: "Référentiel",
    href: "/dashboard/ressources/referentiel",
    group: "ressources",
    roles: ["admin_examens"],
    icon: BookOpenIcon
  },
  // Commun
  {
    label: "Paramètres",
    href: "/dashboard/settings",
    group: "parametres",
    roles: ["etudiant", "prof", "chef_dept", "admin_examens", "doyen"],
    icon: CogIcon
  }
];

// Fonction pour filtrer les items selon le rôle
export const getNavItemsForRole = (role) => {
  if (!role) return [];
  return NAV_ITEMS.filter(item => item.roles.includes(role));
};

// Fonction pour grouper les items
export const groupNavItems = (items) => {
  const grouped = {};
  items.forEach(item => {
    if (!grouped[item.group]) {
      grouped[item.group] = [];
    }
    grouped[item.group].push(item);
  });
  return grouped;
};


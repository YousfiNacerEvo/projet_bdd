// Configuration de navigation basée sur les rôles

export const NAV_ITEMS = [
  // Pages communes
  {
    label: "Vue d'ensemble",
    href: "/dashboard/overview",
    group: "principal",
    roles: ["etudiant", "prof", "chef_dept", "admin_examens", "doyen"],
    icon: "📊"
  },
  {
    label: "Mon planning",
    href: "/dashboard/mon-planning",
    group: "principal",
    roles: ["etudiant", "prof"],
    icon: "📅"
  },
  {
    label: "Surveillance",
    href: "/dashboard/surveillance",
    group: "principal",
    roles: ["prof"],
    icon: "👁️"
  },
  // Chef de département
  {
    label: "Conflits",
    href: "/dashboard/conflits",
    group: "departement",
    roles: ["chef_dept", "admin_examens", "doyen"],
    icon: "⚠️"
  },
  {
    label: "KPIs",
    href: "/dashboard/kpis",
    group: "departement",
    roles: ["chef_dept", "doyen", "admin_examens"],
    icon: "📈"
  },
  {
    label: "Validation",
    href: "/dashboard/validation",
    group: "departement",
    roles: ["chef_dept", "doyen"],
    icon: "✅"
  },
  // Admin examens
  {
    label: "Générer planning",
    href: "/dashboard/planning/generate",
    group: "planning",
    roles: ["admin_examens"],
    icon: "⚙️"
  },
  {
    label: "Historique",
    href: "/dashboard/planning/runs",
    group: "planning",
    roles: ["admin_examens"],
    icon: "📋"
  },
  {
    label: "Salles",
    href: "/dashboard/ressources/salles",
    group: "ressources",
    roles: ["admin_examens"],
    icon: "🏢"
  },
  {
    label: "Référentiel",
    href: "/dashboard/ressources/referentiel",
    group: "ressources",
    roles: ["admin_examens"],
    icon: "📚"
  },
  // Commun
  {
    label: "Paramètres",
    href: "/dashboard/settings",
    group: "parametres",
    roles: ["etudiant", "prof", "chef_dept", "admin_examens", "doyen"],
    icon: "⚙️"
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


import type {
  ProfileLanguagePreference,
  ProfileTimezonePreference,
} from "./profile-preferences-storage";

export function profileLocale(language: ProfileLanguagePreference): string {
  if (language === "es") return "es-ES";
  if (language === "fr") return "fr-FR";
  return "en-US";
}

export function formatInProfileTimezone(
  value: string | number | Date,
  language: ProfileLanguagePreference,
  timezone: ProfileTimezonePreference,
  options: Intl.DateTimeFormatOptions = {},
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat(profileLocale(language), {
    timeZone: timezone,
    ...options,
  }).format(date);
}

const translations: Record<ProfileLanguagePreference, Record<string, string>> = {
  en: {
    "What are we building today?": "What are we building today?",
    "Search institutions, missions, evidence...": "Search institutions, missions, evidence...",
    "Search tips": "Search tips",
    Suggestions: "Suggestions",
    "Active institutions": "Active institutions",
    "Active missions": "Active missions",
    "Evidence collected": "Evidence collected",
    "Human reviews / verifications": "Human reviews / verifications",
    "No institutions found in this workspace yet.": "No institutions found in this workspace yet.",
    "No missions found in this workspace yet.": "No missions found in this workspace yet.",
    "No recent activity yet.": "No recent activity yet.",
    "Last 24 hours": "Last 24 hours",
    "Last 30 minutes": "Last 30 minutes",
    "Last 1 hour": "Last 1 hour",
    "Last 6 hours": "Last 6 hours",
    "Last 12 hours": "Last 12 hours",
    "Last 7 days": "Last 7 days",
    "Last 30 days": "Last 30 days",
    "Live snapshot": "Live snapshot",
    "Add metric": "Add metric",
    Refresh: "Refresh",
    Remove: "Remove",
    Start: "Start",
    End: "End",
    Apply: "Apply",
    Profile: "Profile",
    Billing: "Billing",
    Appearance: "Appearance",
    Language: "Language",
    Timezone: "Timezone",
    "Log out": "Log out",
  },
  es: {
    "What are we building today?": "¿Qué estamos construyendo hoy?",
    "Search institutions, missions, evidence...": "Buscar instituciones, misiones y evidencias...",
    "Search tips": "Consejos de búsqueda",
    Suggestions: "Sugerencias",
    "Active institutions": "Instituciones activas",
    "Active missions": "Misiones activas",
    "Evidence collected": "Evidencia recopilada",
    "Human reviews / verifications": "Revisiones / verificaciones humanas",
    "No institutions found in this workspace yet.": "Aún no hay instituciones en este espacio de trabajo.",
    "No missions found in this workspace yet.": "Aún no hay misiones en este espacio de trabajo.",
    "No recent activity yet.": "Aún no hay actividad reciente.",
    "Last 24 hours": "Últimas 24 horas",
    "Last 30 minutes": "Últimos 30 minutos",
    "Last 1 hour": "Última hora",
    "Last 6 hours": "Últimas 6 horas",
    "Last 12 hours": "Últimas 12 horas",
    "Last 7 days": "Últimos 7 días",
    "Last 30 days": "Últimos 30 días",
    "Live snapshot": "Resumen en vivo",
    "Add metric": "Añadir métrica",
    Refresh: "Actualizar",
    Remove: "Eliminar",
    Start: "Inicio",
    End: "Fin",
    Apply: "Aplicar",
    Profile: "Perfil",
    Billing: "Facturación",
    Appearance: "Apariencia",
    Language: "Idioma",
    Timezone: "Zona horaria",
    "Log out": "Cerrar sesión",
  },
  fr: {
    "What are we building today?": "Que construisons-nous aujourd’hui ?",
    "Search institutions, missions, evidence...": "Rechercher des institutions, missions et preuves...",
    "Search tips": "Conseils de recherche",
    Suggestions: "Suggestions",
    "Active institutions": "Institutions actives",
    "Active missions": "Missions actives",
    "Evidence collected": "Preuves collectées",
    "Human reviews / verifications": "Revues / vérifications humaines",
    "No institutions found in this workspace yet.": "Aucune institution dans cet espace de travail pour le moment.",
    "No missions found in this workspace yet.": "Aucune mission dans cet espace de travail pour le moment.",
    "No recent activity yet.": "Aucune activité récente pour le moment.",
    "Last 24 hours": "Dernières 24 heures",
    "Last 30 minutes": "30 dernières minutes",
    "Last 1 hour": "Dernière heure",
    "Last 6 hours": "6 dernières heures",
    "Last 12 hours": "12 dernières heures",
    "Last 7 days": "7 derniers jours",
    "Last 30 days": "30 derniers jours",
    "Live snapshot": "Instantané en direct",
    "Add metric": "Ajouter une métrique",
    Refresh: "Actualiser",
    Remove: "Supprimer",
    Start: "Début",
    End: "Fin",
    Apply: "Appliquer",
    Profile: "Profil",
    Billing: "Facturation",
    Appearance: "Apparence",
    Language: "Langue",
    Timezone: "Fuseau horaire",
    "Log out": "Se déconnecter",
  },
};

export function profileText(language: ProfileLanguagePreference, key: string): string {
  return translations[language][key] ?? key;
}

import type { MetricKey } from "@/domain/metrics";

type Copy = { en: string; es: string };
type Locale = "en" | "es";

export function pick(copy: Copy, locale: string): string {
  return copy[(locale === "es" ? "es" : "en") as Locale];
}

/**
 * Outcomes dashboard copy from Content Pack 13.5, verbatim.
 * TODO(copy): the Content Pack has no Spanish for 13.5, so both locales use the English text.
 */
const same = (en: string): Copy => ({ en, es: en });

export const METRIC_COPY: Record<MetricKey, { name: Copy; value: Copy; target: Copy; how: Copy }> = {
  completion: {
    name: same("Finish the Rotation"),
    value: same("Completion rate"),
    target: same("85% or more"),
    how: same("Students who finished the rotation, divided by all students enrolled in the cohort."),
  },
  reach: {
    name: same("Reach Students Who Need It Most"),
    value: same("First-gen or Pell share"),
    target: same("60% or more"),
    how: same(
      "Students who said they are first-generation or receive a Pell Grant, divided by all students enrolled, counting only students who agreed to share answers in totals. Shown only when 5 or more students are counted.",
    ),
  },
  references: {
    name: same("Leave with 3 Senior References"),
    value: same("Share of completers with 3+ confirmed references"),
    target: same("Every completer"),
    how: same("Completers with 3 or more confirmed senior references, divided by all completers."),
  },
  offers: {
    name: same("Get a Public-Sector Offer"),
    value: same("Offer rate"),
    target: same("30% or more"),
    how: same(
      "Completers with a public-sector job offer or apprenticeship within six months, divided by all completers. In this pilot we count from rotation completion, because most completers have not graduated yet.",
    ),
  },
  offerDays: {
    name: same("Offer Within 30 Days"),
    value: same("Median days from joining the hiring lane to an offer"),
    target: same("30 days or fewer"),
    how: same(
      "The middle value of days between joining the hiring lane and receiving an offer, for completers who received one.",
    ),
  },
  vendor: {
    name: same("Interview with a City Vendor"),
    value: same("Vendor interview rate"),
    target: same("50% or more"),
    how: same(
      "Completers not hired by the city who had at least one interview with a city vendor, divided by all completers not hired by the city.",
    ),
  },
  underemployment: {
    name: same("Lower Underemployment than Peers"),
    value: same("Completers vs. matched peers"),
    target: same("Lower than matched peers"),
    how: same(
      "One year after graduation, the share of completers in jobs that do not require a degree, compared with matched peers from the same college and majors, from the college's outcomes survey. The first reading is due one year after the first completers graduate.",
    ),
  },
};

/** Pilot budget funding list, Content Pack 13.5, in order. TODO(copy): no Spanish in the Content Pack. */
export const FUNDING_SOURCES: Copy[] = [
  same("City salary savings from positions that sit vacant during long hiring cycles"),
  same("The college's experiential learning budget"),
  same("Work-Study community service funds where available"),
  same("Local workforce boards and philanthropy"),
  same("Optional vendor sponsorships"),
];

/** Match reason template from Content Pack 13.4.7 (Amara's match reason). */
export function matchReason(major: string, unit: string, overlap: number, free: number) {
  return `${major} maps to the ${unit}. ${overlap} of your ${free} free hours overlap the office's hours.`;
}

// TODO(copy): UI labels below are not in the Content Pack. Short, plain, sentence case.
export const CITY_COPY = {
  matchingEmptyTitle: { en: "No One Is Waiting for a Match", es: "Nadie está esperando asignación" },
  matchingEmptyBody: {
    en: "Students appear here after they finish onboarding and give both consents.",
    es: "Los estudiantes aparecen aquí cuando terminan la inscripción y aceptan ambos consentimientos.",
  },
  noSuggestions: { en: "No unit with open seats takes this major. You can choose any unit.", es: "Ninguna unidad con lugares libres recibe esta carrera. Puedes elegir cualquier unidad." },
  unitLabel: { en: "Teaching unit", es: "Unidad de formación" },
  classificationLabel: { en: "Job classification", es: "Clasificación del puesto" },
  department: { en: "Department", es: "Departamento" },
  line: { en: "Line", es: "Línea" },
  title: { en: "Title", es: "Título" },
  students: { en: "Students", es: "Estudiantes" },
  week: { en: "Week", es: "Semana" },
  allClassifications: { en: "All classifications", es: "Todas las clasificaciones" },
  filter: { en: "Filter", es: "Filtrar" },
  noOpenings: { en: "No Openings Yet", es: "Todavía no hay vacantes" },
  noOpeningsBody: { en: "Create an opening, then invite people from the hiring lane.", es: "Crea una vacante y luego invita a personas de la vía de contratación." },
  noOneToInvite: { en: "No one in the hiring lane for this classification right now.", es: "Ahora no hay nadie en la vía de contratación para esta clasificación." },
  statusLabel: { en: "Status", es: "Estado" },
  openingStatus: {
    draft: { en: "Draft", es: "Borrador" },
    open: { en: "Open", es: "Abierta" },
    filled: { en: "Filled", es: "Cubierta" },
    closed: { en: "Closed", es: "Cerrada" },
  },
  plainStatus: {
    none: { en: "No plain-language version yet", es: "Aún sin versión en lenguaje sencillo" },
    draft: { en: "Draft, not shown to students", es: "Borrador, no se muestra a estudiantes" },
    approved: { en: "Approved, shown to students", es: "Aprobado, se muestra a estudiantes" },
  },
  officialDescription: { en: "Official Description", es: "Descripción oficial" },
  summary: { en: "Summary", es: "Resumen" },
  onePerLine: { en: "One per line", es: "Uno por línea" },
  vendorName: { en: "Firm", es: "Empresa" },
  ended: { en: "Ended", es: "Terminado" },
  active: { en: "Active", es: "Activo" },
  enrollmentsByUnit: { en: "Students by Unit", es: "Estudiantes por unidad" },
  overdueList: { en: "Ratings Overdue", es: "Evaluaciones atrasadas" },
  activeStudents: { en: "Active Students", es: "Estudiantes activos" },
  preceptor: { en: "Preceptor", es: "Preceptora o preceptor" },
  sponsor: { en: "Sponsor", es: "Patrocinador o patrocinadora" },
  value: { en: "Value", es: "Valor" },
  target: { en: "Target", es: "Meta" },
  metric: { en: "Metric", es: "Métrica" },
  vsPeers: { en: "{value}% vs. {peer}% for peers", es: "{value}% frente a {peer}% de pares" },
  daysValue: { en: "{days} days", es: "{days} días" },
  completed: { en: "Rotation marked complete.", es: "Rotación marcada como completa." },
  saved: { en: "Saved", es: "Guardado" },
  consentOn: { en: "Both given", es: "Ambos otorgados" },
  consentMissing: { en: "Missing", es: "Falta" },
  enrollmentStatus: {
    proposed: { en: "Proposed", es: "Propuesta" },
    active: { en: "Active", es: "Activa" },
    completed: { en: "Completed", es: "Completada" },
    withdrawn: { en: "Withdrawn", es: "Retirada" },
    none: { en: "Not matched", es: "Sin asignar" },
  },
  name: { en: "Name", es: "Nombre" },
  fewerThanFiveNote: { en: "Fewer than 5", es: "Menos de 5" },
  noCohort: { en: "No students in this cohort yet.", es: "Todavía no hay estudiantes en este grupo." },
} satisfies Record<string, Copy | Record<string, Copy>>;

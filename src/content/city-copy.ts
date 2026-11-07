import type { MetricKey } from "@/domain/metrics";

type Copy = { en: string; es: string };
type Locale = "en" | "es";

export function pick(copy: Copy, locale: string): string {
  return copy[(locale === "es" ? "es" : "en") as Locale];
}

/** Outcomes dashboard copy: English verbatim from Content Pack 13.5, with Spanish translations. */
const c = (en: string, es: string): Copy => ({ en, es });

export const METRIC_COPY: Record<MetricKey, { name: Copy; value: Copy; target: Copy; how: Copy }> = {
  completion: {
    name: c("Finish the Rotation", "Terminar la rotación"),
    value: c("Completion rate", "Tasa de finalización"),
    target: c("85% or more", "85% o más"),
    how: c(
      "Students who finished the rotation, divided by all students enrolled in the cohort.",
      "Estudiantes que terminaron la rotación, divididos entre todos los estudiantes inscritos en el grupo.",
    ),
  },
  reach: {
    name: c("Reach Students Who Need It Most", "Llegar a quienes más lo necesitan"),
    value: c("First-gen or Pell share", "Proporción de primera generación o con beca Pell"),
    target: c("60% or more", "60% o más"),
    how: c(
      "Students who said they are first-generation or receive a Pell Grant, divided by all students enrolled, counting only students who agreed to share answers in totals. Shown only when 5 or more students are counted.",
      "Estudiantes que dijeron ser la primera generación de su familia en la universidad o recibir una beca Pell, divididos entre todos los estudiantes inscritos, contando solo a quienes aceptaron incluir sus respuestas en los totales. Se muestra solo cuando se cuentan 5 estudiantes o más.",
    ),
  },
  references: {
    name: c("Leave with 3 Senior References", "Terminar con 3 referencias sénior"),
    value: c("Share of completers with 3+ confirmed references", "Proporción de egresados con 3 o más referencias confirmadas"),
    target: c("Every completer", "Todos los egresados"),
    how: c(
      "Completers with 3 or more confirmed senior references, divided by all completers.",
      "Egresados con 3 o más referencias sénior confirmadas, divididos entre todos los egresados.",
    ),
  },
  offers: {
    name: c("Get a Public-Sector Offer", "Recibir una oferta del sector público"),
    value: c("Offer rate", "Tasa de ofertas"),
    target: c("30% or more", "30% o más"),
    how: c(
      "Completers with a public-sector job offer or apprenticeship within six months, divided by all completers. In this pilot we count from rotation completion, because most completers have not graduated yet.",
      "Egresados con una oferta de empleo o de aprendizaje en el sector público dentro de seis meses, divididos entre todos los egresados. En este piloto contamos desde que terminan la rotación, porque la mayoría aún no se ha graduado.",
    ),
  },
  offerDays: {
    name: c("Offer Within 30 Days", "Oferta en 30 días o menos"),
    value: c("Median days from joining the hiring lane to an offer", "Mediana de días desde la entrada a la vía de contratación hasta la oferta"),
    target: c("30 days or fewer", "30 días o menos"),
    how: c(
      "The middle value of days between joining the hiring lane and receiving an offer, for completers who received one.",
      "El valor central de los días entre la entrada a la vía de contratación y la oferta, para los egresados que recibieron una.",
    ),
  },
  vendor: {
    name: c("Interview with a City Vendor", "Entrevista con un proveedor de la ciudad"),
    value: c("Vendor interview rate", "Tasa de entrevistas con proveedores"),
    target: c("50% or more", "50% o más"),
    how: c(
      "Completers not hired by the city who had at least one interview with a city vendor, divided by all completers not hired by the city.",
      "Egresados no contratados por la ciudad que tuvieron al menos una entrevista con un proveedor de la ciudad, divididos entre todos los egresados no contratados por la ciudad.",
    ),
  },
  underemployment: {
    name: c("Lower Underemployment than Peers", "Menos subempleo que sus pares"),
    value: c("Completers vs. matched peers", "Egresados frente a pares comparables"),
    target: c("Lower than matched peers", "Menor que el de pares comparables"),
    how: c(
      "One year after graduation, the share of completers in jobs that do not require a degree, compared with matched peers from the same college and majors, from the college's outcomes survey. The first reading is due one year after the first completers graduate.",
      "Un año después de la graduación, la proporción de egresados en empleos que no requieren título universitario, comparada con la de pares comparables de la misma universidad y carreras, según la encuesta de resultados de la universidad. La primera medición llega un año después de que se gradúen los primeros egresados.",
    ),
  },
};

/** Pilot budget funding list, Content Pack 13.5, in order, with Spanish translations. */
export const FUNDING_SOURCES: Copy[] = [
  c(
    "City salary savings from positions that sit vacant during long hiring cycles",
    "Ahorros de salarios de la ciudad en puestos que quedan vacantes durante procesos de contratación largos",
  ),
  c("The college's experiential learning budget", "El presupuesto de aprendizaje experiencial de la universidad"),
  c("Work-Study community service funds where available", "Fondos de servicio comunitario de Work-Study donde estén disponibles"),
  c("Local workforce boards and philanthropy", "Juntas locales de desarrollo laboral y filantropía"),
  c("Optional vendor sponsorships", "Patrocinios opcionales de proveedores"),
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
    es: "Los estudiantes aparecen aquí cuando terminan el registro inicial y aceptan ambos consentimientos.",
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
    approved: { en: "Approved, shown to students", es: "Aprobada, se muestra a estudiantes" },
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
  vsPeers: { en: "{value}% vs. {peer}% for peers", es: "{value}% frente a {peer}% de sus pares" },
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

/**
 * CityGov Hackathon 2026 submission. English only (the submission language).
 * Facts and figures come from the PRD Content Pack (13.1 to 13.6); wording is condensed for the form.
 */

export const DEMO_URL = "https://teaching-city-app.vercel.app/demo";
export const SITE_URL = "https://teaching-city-app.vercel.app";

export type TeamMember = { name: string; role: string; email?: string; profileUrl?: string };

/** Add each member's CityGov profile link before submitting. */
export const team: TeamMember[] = [{ name: "Rofy Ray", role: "Team Lead", email: "rofyray-bot@yahoo.com" }];

export const title = {
  name: "Teaching City",
  tagline: "Nursing has clinicals. Now every major does.",
  summary:
    "A college-city compact that gives students in majors without a placement pipeline a paid, for-credit semester inside local government, then turns that observed work into a fast hiring lane and a network of people who will vouch for them.",
};

export const problem = {
  paragraphs: [
    "Students in majors with no built-in placement pipeline graduate without the three things that best predict a good first job: paid, relevant experience; senior professional relationships; and an employer who has watched them work. First-generation and low-income students feel this most. They work more hours during school, complete fewer internships, and start with networks of family and neighbors rather than managers and mentors.",
    "Meanwhile the local governments in their own college towns face a retirement wave, take about 130 days to fill a job, and are flooded with AI-polished applications they cannot tell apart. Nearly half of students do not know their field exists in government.",
    "Nursing and teaching students already have the missing bridge: a structured rotation inside the institutions that will hire them, and some of the lowest unemployment of any major. Almost every other major crosses the gap alone.",
  ],
  figures: [
    { signal: "Recent grads underemployed one year out", figure: "52%", source: "Strada / Burning Glass", href: "https://poetsandquantsforundergrads.com/?p=157970" },
    { signal: "Underemployed first job still underemployed a decade later", figure: "73%", source: "Strada / Burning Glass", href: "https://poetsandquantsforundergrads.com/?p=157970" },
    { signal: "Lower odds of underemployment with an internship", figure: "48.5%", source: "Higher Ed Today", href: "https://www.higheredtoday.org/2024/04/15/underemployment-and-its-long-term-effects-for-college-graduates" },
    { signal: "First-gen vs. continuing-gen internship completion", figure: "47% vs. 56%", source: "WorkShift (Strada)", href: "https://workshift.org/students-have-career-plans-in-place-but-not-networks/" },
    { signal: "Students unaware their field is in demand in local government", figure: "44%", source: "MissionSquare, 2025", href: "https://research.missionsq.org/content/media/document/2025/9/UndergraduateCareerAttitudes.pdf" },
    { signal: "Average local government time to fill (vs. 36 days private)", figure: "130 days", source: "NEOGOV", href: "https://blog.neogov.com/time-to-hire" },
  ],
  sides: [
    ["Lack a paid first experience and senior contacts", "Face a retirement wave and roles that are hard to fill"],
    ["44% do not know their field exists in government", "Rely on job boards students never check"],
    ["Send AI-polished applications that all look alike", "Drown in applicants, convert few, take about 130 days"],
    ["Are influenced most by personal recommendations", "Have thousands of mid-career staff who could vouch for them"],
  ],
};

export const users = [
  {
    user: "Students and recent graduates",
    who: "Juniors, seniors and community college students in majors without clinical-style placements: business, accounting, IT, communications, social sciences, humanities, criminal justice and engineering. Priority goes to first-gen and Pell students, adult learners, veterans and career changers.",
    gets: "Paid work, academic credit, a verified work record, 3 or more senior references and a direct hiring lane.",
  },
  {
    user: "City departments and HR",
    who: "Mid-size cities and counties near a college, especially departments with retirements ahead or hard-to-fill roles.",
    gets: "A pre-vetted talent stream, backlog work done, and faster, lower-risk hiring.",
  },
  {
    user: "Colleges",
    who: "Career services, deans and provosts at regional public universities and community colleges.",
    gets: "Paid experiential learning for every major and stronger graduate earnings ahead of the federal earnings test.",
  },
  {
    user: "City vendors",
    who: "Engineering, audit, IT and consulting firms that hold city contracts.",
    gets: "A screened entry-level pipeline for roles the city does not hire for.",
  },
];

/** 500 to 750 words. */
export const solution = [
  "Teaching City turns City Hall into a teaching hospital for every major. It is a compact between a college and its city that gives students in majors without a placement pipeline a paid, for-credit \"civic rotation\" inside local government, modeled on nursing clinicals. The rotation produces something today's hiring market lacks: a semester of observed work, rated by the people who will hire.",
  "The model has four parts, run together by the college and the city on one mobile-first platform.",
  "The Rotation. Students spend one semester, 10 to 12 paid hours a week, for academic credit, inside a city \"teaching unit\" matched to their major. Accounting majors join the budget office, IT majors join IT operations or GIS, communications majors join public information and 311, and so on. They work in cohorts of 10 to 20 on real department backlogs, scheduled around their jobs and classes. The platform suggests units by major and by how much of a student's free time overlaps the office's hours, and a city coordinator confirms every match.",
  "The Preceptor Network. Each student works under a trained mid-career city employee, the preceptor, and meets monthly with a director-level sponsor for career conversations. The goal is concrete: every completer leaves with at least three senior professionals willing to act as references. For a first-generation student, that replaces the family connections many peers take for granted.",
  "The Civic Transcript. Each week the preceptor rates five skills taken from the city's own entry-level job classification, in about two minutes, and signs a short note. Ratings, evidence sentences, verified work samples and approved quotes from references build into a record the student owns. Students decide who sees it: City HR, firms in the Vendor Bridge, or anyone with a link they can turn off at any time. City HR accepts the transcript as the skills assessment for designated entry-level roles, so the work itself becomes the application.",
  "The Hiring Lane and Vendor Bridge. Completers who finish with all five skills at the bar, three confirmed references and City HR sharing on enter a standing pre-qualified pool automatically. Coordinators invite pool members to openings and skip the screening already done during the rotation, with a target of an offer in 30 days instead of about 130. For students who want other paths, the city adds a voluntary pledge to its contracts: firms that work for the city agree to interview Teaching City completers. The city's procurement network becomes a professional network.",
  "The platform carries the whole loop. Students see what is due this week, log hours, upload work samples and track their references. Preceptors rate on a phone in two minutes. Coordinators run matching, the hiring lane, openings and vendor pledges, and watch an outcomes dashboard that computes every success metric live from the data. It works on low-end phones, meets WCAG 2.2 AA, runs in English and Spanish, and uses consent the student controls.",
  "AI helps with three writing tasks: drafting a preceptor's weekly note from rough notes, rewriting city job classifications in plain language, and suggesting which roles a student's courses connect to. Every output is a draft a named person accepts, edits or discards. AI never ranks, scores or screens a student; people make every selection and hiring decision.",
  "Funding blends sources so no single cut ends it: city salary savings from positions that sit vacant during long hiring cycles, the college's experiential learning budget, Work-Study community service funds, local workforce boards and philanthropy, and optional vendor sponsorships. At $17 an hour, one student-semester costs about $2,800 in wages.",
  "Most tools help students find opportunities. Teaching City creates the opportunity, the relationships and the hiring decision in one place, and it does so at the moment AI has made résumés interchangeable and observed work the signal employers trust.",
];

export const alternatives = [
  { category: "Job platforms", examples: "Handshake, LinkedIn, GovernmentJobs.com", misses: "No experience or relationships; keyword search hides public roles students never think to look for" },
  { category: "Micro-internships", examples: "Parker Dewey, Riipen, Forage", misses: "Mostly remote and transactional; rarely public sector" },
  { category: "Civic fellowships", examples: "Coding it Forward, Lead for America", misses: "Small, competitive, summer-only, skewed to tech or policy majors" },
  { category: "University-city course partnerships", examples: "EPIC-N, UO Sustainable City Year", misses: "Unpaid class deliverables; no hiring conversion" },
  { category: "Social capital nonprofits", examples: "Basta, Braven, Year Up", misses: "Limited cohort size; mostly private employers" },
  { category: "Government hiring reform", examples: "Skills-based hiring", misses: "Not connected to campus pipelines" },
];

export const criteria = [
  ["Barrier clarity", "One specific barrier: no structured rotation for most majors, backed by national data"],
  ["Usefulness", "Students get pay, credit, references and a job lane in one program"],
  ["Creativity", "Clinical-rotation model applied to all majors; procurement network as social capital"],
  ["Pilot feasibility", "Uses existing courses, staff and budgets; 30 students, one semester, about $135K"],
  ["Equity", "Paid, scheduled around jobs, prioritizes first-gen and Pell; replaces missing networks"],
  ["Civic relevance", "Cities are the host, the hirer and the network hub"],
  ["Scalability", "Replicates to any city with a nearby college; layered funding"],
  ["Measurable outcomes", "Completion, references, offers, time to offer, underemployment against peers"],
  ["Accessibility", "Mobile-first, bilingual, WCAG 2.2 AA, student-controlled consent, people make every decision"],
];

/** About 400 words. */
export const equity = [
  "The students Teaching City is built for are the ones the current system leaves out. First-generation students complete internships at lower rates than their peers, 47% against 56%. Pell recipients and adult learners often cannot take unpaid internships because they already work to pay for school. Their networks are made of family and neighbors who love them but cannot introduce them to a hiring manager. When they apply, their résumés look like everyone else's, and a 130-day hiring process gives them no chance to show their work.",
  "Teaching City answers each of those gaps with a design choice. The rotation is paid, at about $17 an hour, so taking part does not mean giving up income. It earns academic credit, so it counts toward the degree instead of competing with it. Hours are scheduled around each student's jobs and classes: students mark the hours they are free, and matching starts from the overlap with each office's schedule, not from who is available full time.",
  "The Preceptor Network replaces the connections these students never had. Every student is guaranteed a preceptor who watches their work each week and a director who meets with them monthly. The target is that every completer leaves with at least three senior professionals willing to vouch for them, confirmed in the platform rather than assumed.",
  "Hiring follows observed work, which levels the field. Ratings come from a short rubric tied to the city's own job classification, written in plain language with evidence from the student's real tasks. A student who could not afford an unpaid summer internship can still earn a record that City HR accepts as the skills assessment. AI never ranks, scores or screens anyone, and every hiring decision stays with people.",
  "The program also measures whether it reaches the students it was built for. Students may share whether they are first-generation, receive a Pell Grant, are adult learners or are veterans. These answers are optional, never shown to anyone but the student, never sent to AI, and reported only as totals of five or more. The target is that at least 60% of participants are first-generation or Pell recipients.",
  "Students own their record and can turn sharing off at any time. The platform works on low-end phones, in English and Spanish, so the students who need it most can use it.",
];

export const pilot = {
  host: "One mid-size city, one regional public university and one community college. In the demo they are the fictional City of Westbrook, Westbrook State University and Westbrook Community College. The city hosts the rotation; the colleges recruit students and award credit.",
  participants:
    "30 students across six teaching units (budget, public works, IT and GIS, housing and community services, public information and 311, and courts and emergency management), 15 trained preceptors, six director-level sponsors, one city coordinator, one coordinator at each college, and an initial group of vendor firms that sign the pledge.",
  timeline: [
    { when: "Days 1 to 30", what: "Sign the college-city compact, choose six teaching units, map each unit's entry-level classification to a five-skill rubric, and recruit preceptors and sponsors." },
    { when: "Days 31 to 60", what: "Train preceptors on the two-minute rubric, set up the platform, open student onboarding with consent, and invite vendors to sign the pledge." },
    { when: "Days 61 to 90", what: "Confirm 30 matches by major and schedule, run orientation, and agree with City HR which roles accept the Civic Transcript as the skills assessment." },
    { when: "Weeks 1 to 15", what: "Rotation semester: weekly hours and ratings, monthly sponsor meetings, references confirmed along the way, mid-semester check-in at week 8." },
    { when: "After week 15", what: "Completers who meet the bar enter the hiring lane; openings, interviews and offers tracked against the 30-day target; vendor interviews for other paths; 6- and 12-month outcome surveys." },
  ],
  resources: [
    { label: "Staff", text: "A half-time city coordinator, a college coordinator at each campus, 15 preceptors giving about two minutes a week per student plus daily guidance, and six sponsors meeting each student monthly." },
    { label: "Funding", text: "Blended: city salary savings from vacant positions, college experiential learning budgets, Work-Study community service funds where available, workforce boards and philanthropy, and optional vendor sponsorships." },
    { label: "Technology", text: "The Teaching City platform (built and demonstrated here) on Vercel with a managed Postgres database, private file storage and an AI gateway for the three drafting features." },
    { label: "Partnerships", text: "The college-city compact, City HR agreement to accept the Civic Transcript for designated roles, and the voluntary vendor pledge added to city contracts." },
  ],
  cost: {
    oneTime: [{ item: "Platform setup and hosting for the pilot year", amount: "$6,000" }],
    ongoing: [
      { item: "Student wages: 30 students, 15 weeks, 11 hours a week, $17 an hour", amount: "$84,150" },
      { item: "Half-time coordinator", amount: "$45,000" },
    ],
    total: "$135,150",
    perStudent: "$2,805 in wages per student-semester",
    note: "Every figure is an assumption that can be changed in the pilot budget calculator inside the demo (city coordinator view).",
  },
  metrics: [
    { metric: "Completion", target: "85% or more finish the rotation", how: "Completers divided by all enrolled students" },
    { metric: "Reach", target: "60% or more are first-gen or Pell recipients", how: "Self-reported, optional answers, shown only as totals of 5 or more" },
    { metric: "References", target: "Every completer has 3 or more confirmed senior references", how: "References confirmed by referees in the platform" },
    { metric: "Offers", target: "30% or more get a public-sector offer within six months, in 30 days or less", how: "Offer dates recorded against the day each completer joined the hiring lane" },
    { metric: "Vendor interviews", target: "Half of completers not hired by the city get at least one", how: "Interviews recorded by vendors in the portal" },
  ],
  risks: [
    { risk: "Privacy", mitigation: "Consent is collected per use and students control sharing; demographic answers are optional and reported only in totals of 5 or more; files are private and served through permission checks. A FERPA and city HR review happens before any real student data." },
    { risk: "Adoption", mitigation: "Rating takes about two minutes on a phone, with weekly reminders. Preceptors are trained and recognized, and City HR agrees in advance which roles accept the transcript." },
    { risk: "Equity", mitigation: "Paid hours scheduled around jobs and classes, priority recruitment of first-gen and Pell students, a live reach metric, and AI that never ranks or screens anyone." },
    { risk: "Capacity", mitigation: "Cohorts are sized to each unit's seats (five or six per unit), with two students per preceptor at most. Vendor pledge language is reviewed by the city attorney before it enters contracts." },
  ],
  scale:
    "If the pilot meets its targets, add teaching units and a second semester cohort in the same city, then offer the model to other city-college pairs as a ready template: compact, rubric library, preceptor training and the platform, which already supports more than one program. Funding grows with it through vacancy savings and vendor sponsorships, and the outcomes dashboard gives each new partner the same measures from day one.",
};

export const metrics = [
  {
    name: "Placements",
    target: "30% or more of completers receive a public-sector job offer or apprenticeship within six months, with the offer made in 30 days or less from joining the hiring lane.",
    how: "Offer dates are recorded on each opening invite and counted from the day the completer entered the pool.",
  },
  {
    name: "Interviews",
    target: "Half of completers not hired by the city get at least one interview with a city vendor.",
    how: "Vendors request and record interviews in their portal; the dashboard counts completers with at least one.",
  },
  {
    name: "Advising reach",
    target: "Every completer leaves with 3 or more confirmed senior references, and 60% or more of participants are first-gen or Pell recipients.",
    how: "Referees confirm references in the platform; reach comes from optional, self-reported answers shown only in totals of 5 or more.",
  },
];

export const demoSteps = [
  "Open the demo and continue as Amara, a student in week 6. See what is due this week, her route and her Civic Transcript.",
  "Switch to Dana, her preceptor, and rate week 6 in about two minutes.",
  "Back as Amara: she now has 5 of 5 skills at the bar.",
  "Switch to Renee, the city coordinator: record an offer for Luis in the hiring lane and see the outcomes update.",
  "Switch to Kim at a city vendor: browse completers who opted in and request an interview.",
];

export const sources = {
  research: [
    { label: "Strada / Burning Glass Institute, Talent Disrupted", href: "https://poetsandquantsforundergrads.com/?p=157970" },
    { label: "Higher Ed Today, underemployment and its long-term effects", href: "https://www.higheredtoday.org/2024/04/15/underemployment-and-its-long-term-effects-for-college-graduates" },
    { label: "WorkingNation, first post-college job", href: "https://workingnation.jff.org/report-first-post-college-job-plays-a-pivotal-role/" },
    { label: "WorkShift (Strada), career plans without networks", href: "https://workshift.org/students-have-career-plans-in-place-but-not-networks/" },
    { label: "NPR / New York Fed, recent graduate unemployment", href: "https://wnyc.org/npr/nx-s1-5910677" },
    { label: "NewsNation / New York Fed, majors with the lowest unemployment", href: "https://www.newsnationnow.com/us-news/education/college-majors-lowest-unemployment/amp/" },
    { label: "MissionSquare Research Institute, undergraduate career attitudes (2025)", href: "https://research.missionsq.org/content/media/document/2025/9/UndergraduateCareerAttitudes.pdf" },
    { label: "NEOGOV, time to hire", href: "https://blog.neogov.com/time-to-hire" },
    { label: "PSHRA on Work for America (2026)", href: "https://pshra.org/report-public-sector-hiring-systems-not-keeping-up-with-applicant-interest/" },
    { label: "NASFAA, proposed earnings premium accountability", href: "https://www.nasfaa.org/news-item/38732/Trump_Administration_Proposes_New_Earnings_Premium_Accountability_System" },
    { label: "BestColleges, internships and networks", href: "https://bestcolleges.com/news/study-college-students-internships-land-jobs-not-explore" },
  ],
  tools: [
    "Next.js and React (MIT)",
    "Tailwind CSS (MIT)",
    "Drizzle ORM (Apache 2.0) on Neon Postgres",
    "Better Auth (MIT)",
    "next-intl (MIT)",
    "AI SDK (Apache 2.0) through Vercel AI Gateway",
    "Phosphor Icons (MIT)",
    "Zod (MIT), pdf-lib (MIT), node-postgres (MIT)",
    "Vitest (MIT), Playwright (Apache 2.0), axe-core (MPL 2.0)",
    "Overpass typeface (SIL Open Font License)",
    "Hosted on Vercel, with Vercel Blob for private files",
  ],
  data: "Every person, school, city, firm and number in the demo is fictional sample data.",
};

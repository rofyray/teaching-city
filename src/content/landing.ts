/** Content Pack 13.1.1, verbatim. */
export const landing = {
  title: "Nursing has clinicals. Now every major does.",
  lead: "Teaching City turns City Hall into a teaching hospital for every major. It is a college-city compact that gives students in majors without a placement pipeline a paid, credit-bearing \"civic rotation\" inside local government, modeled on nursing clinicals.",
  primaryAction: "Try the demo",
  secondaryLink: "How it works",
  barrier: {
    heading: "The Barrier",
    body: "The barrier is not a lack of talent or job listings. It is the absence of a structured rotation that lets employers see students do real work before hiring them, the bridge nursing and teaching students already have.",
  },
  route: {
    heading: "Four Parts, One Route",
    stations: [
      { name: "1. The Rotation", line: "One paid semester inside a city office matched to your major, for credit." },
      { name: "2. The Preceptor Network", line: "A preceptor guides you weekly and a director meets with you monthly." },
      { name: "3. The Civic Transcript", line: "Weekly ratings of real work become a record you own." },
      { name: "4. The Hiring Lane and Vendor Bridge", line: "Meet the bar and join a pre-qualified pool, or interview with city vendors." },
    ],
  },
  whyNow: {
    heading: "Why Now",
    body: "In an AI-saturated hiring market, a résumé is cheap and observed work is scarce. Whoever watches a student do real work for a semester holds the most valuable hiring signal there is.",
  },
} as const;

/** Node labels from the PRD Section 3 flow (Core user journeys). */
export const journey = {
  label: "Core user journeys",
  stations: [
    "Student onboards: profile, consent, availability, courses",
    "System suggests units by rule",
    "City coordinator confirms match",
    "Rotation: 15 weeks, 10 to 12 paid hours",
    "Weekly: student logs hours and samples",
    "Weekly: preceptor rates 5 skills and signs a note",
    "Monthly: sponsor meeting",
    "Civic Transcript updates live",
    "References confirmed",
    "Meets the bar at completion?",
  ],
  branches: [
    { edge: "yes", label: "Pre-qualified pool: city hiring lane", next: "Invite, interview, offer: target 30 days" },
    { edge: "other paths", label: "Vendor Bridge interviews", next: null },
  ],
} as const;

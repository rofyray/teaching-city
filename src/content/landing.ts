/** Landing page copy. The tagline is from the Content Pack (13.1.1); the rest is condensed for the site. */
export const landing = {
  title: ["Nursing has clinicals.", "Now every major does."],
  lead: "Teaching City turns City Hall into a teaching hospital for every major: a paid, for-credit semester inside local government, where real work becomes the way in.",
  primaryAction: "Demo",
  secondaryLink: "How it works",
  barrier: {
    heading: "The Barrier",
    body: "Nursing and teaching students get a built-in bridge to work: a supervised rotation inside the places that hire them. Most majors get nothing like it, so employers never see them do real work before deciding.",
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
  semester: {
    heading: "How a Semester Works",
    steps: [
      { who: "You", text: "Pick the hours you are free. You spend 10 to 12 paid hours a week in a city office that fits your major, around your classes and job." },
      { who: "Your preceptor", text: "A city employee in your office rates five skills each week in about two minutes and signs a short note to you." },
      { who: "Your sponsor", text: "Once a month, a director sits down with you to talk about where your career could go." },
      { who: "Your transcript", text: "Every rating, note and work sample adds to your Civic Transcript. You choose who sees it." },
      { who: "What's next", text: "Finish at the bar with three references and you join the city's hiring lane. Prefer another path? City vendors have pledged to interview you." },
    ],
  },
  whyNow: {
    heading: "Why Now",
    body: "AI makes every résumé look polished. A semester of watched, rated work is now the clearest hiring signal there is, and cities are in every college town to offer it.",
  },
  cta: {
    heading: "See It from Every Side",
    body: "Walk through the program as a student, a preceptor, a city coordinator or a recruiter. No account needed.",
    action: "Demo",
  },
} as const;

/** The semester journey (PRD Section 3), in plain words. */
export const journey = {
  label: "One semester, step by step",
  stations: [
    "Sign up: profile, consent, free hours, courses",
    "Get units that fit your major and schedule",
    "The city confirms your match",
    "Rotate 15 weeks, 10 to 12 paid hours a week",
    "Log hours and add work samples",
    "Your preceptor rates five skills and signs a note",
    "Meet your sponsor each month",
    "Your Civic Transcript updates as you go",
    "Senior references confirm they vouch for you",
    "Finish at the bar?",
  ],
  branches: [
    { edge: "Yes", label: "Join the city's hiring lane", next: "Invite, interview, offer within 30 days" },
    { edge: "Other paths", label: "Interview with city vendors", next: null },
  ],
} as const;

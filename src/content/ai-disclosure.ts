/** Content Pack 13.6, verbatim. The "Built with AI" line was filled for the team to confirm. */
export const aiDisclosure = {
  title: "How Teaching City uses AI",
  lead: "AI helps with three writing tasks. People make every selection and hiring decision, and nothing AI writes reaches a student's record until a person accepts it.",
  table: {
    headers: ["Feature", "What it does", "What it receives", "Who reviews it"],
    rows: [
      [
        "Draft from my notes",
        "Turns a preceptor's rough notes into a short note to the student and suggested evidence sentences",
        "The preceptor's notes, the student's first name, the week and the skill names with this week's levels",
        "The preceptor edits and accepts or discards every word",
      ],
      [
        "Plain-language job descriptions",
        "Rewrites a city job classification in everyday language",
        "The classification title and official description, with no student data",
        "City staff approve it before any student sees it",
      ],
      [
        "Roles your courses connect to",
        "Suggests up to three city roles that relate to a student's courses",
        "Course titles and the list of roles and skills, with no names or personal details",
        "The student reads it; the city coordinator sees it as context and makes the match",
      ],
    ],
  },
  neverHeading: "What AI never does in Teaching City:",
  never: [
    "Rank, score, screen or reject a student",
    "See demographic answers, email addresses, hours or past ratings",
    "Publish anything without a person accepting it",
  ],
  modelsLabel: "Models:",
  models: "requests go through Vercel AI Gateway to the model set by the program (AI_MODEL). Each request is logged with the feature, model and size, without storing the text.",
  builtWithLabel: "Built with AI:",
  builtWith:
    "Teaching City was built with Claude Code (Anthropic), which wrote and tested the application code from this PRD, and Claude (Anthropic), which drafted the PRD and design canvas with the team. People reviewed every change.",
} as const;

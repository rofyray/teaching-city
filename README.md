# Teaching City

Nursing has clinicals. Now every major does.

Teaching City turns City Hall into a teaching hospital for every major. Students in majors without a placement pipeline spend one paid, credit-bearing semester inside a city office. A preceptor rates their work each week, a director meets with them each month, and the observed work becomes a Civic Transcript that opens a fast hiring lane with the city or interviews with city vendors.

This repository is the platform for that compact: matching, the weekly hours and rating loop, the Civic Transcript, the hiring lane, the Vendor Bridge and the outcomes dashboard. It was built for the CityGov Hackathon 2026.

Every person, school, city and number in the demo is fictional.

## Try it

Open `/demo` and pick a person. No account is needed.

| Person | Role | Start at |
| --- | --- | --- |
| Amara Okafor | Student in week 6 at the Budget Office | `/s` |
| Dana Ortiz | Preceptor with two ratings due | `/m` |
| Marcus Hill | Sponsor | `/m` |
| Renee Carter | City coordinator | `/city` |
| Omar Patel | College coordinator | `/college` |
| Kim Nguyen | Vendor recruiter | `/vendor` |
| Luis Herrera | Completer in the hiring lane | `/s/openings` |

A 3-minute path: rate Amara's week 6 as Dana (try "Draft from my notes"), switch to Amara and watch her reach 5 of 5 skills at the bar, then record an offer for Luis as Renee and see the outcomes update.

## How it works

- `src/domain` holds the business rules as pure functions with tests: weeks, earnings, ratings at the bar, pool eligibility, time to offer, vendor visibility, matching suggestions and small-count suppression.
- `src/server/permissions.ts` is the permission matrix. Every Server Action and route handler checks it through `src/server/authz.ts`.
- `src/server/ai` holds the three AI features: drafting preceptor notes, plain-language job classifications and course-to-role mapping. Each response is a draft a person accepts, edits or discards. AI never ranks, scores or screens students.
- `src/server/seed` builds the City of Westbrook program relative to today, so the demo student is always in week 6.

## Stack

Next.js 16 (App Router, Server Components, Server Actions), React 19, TypeScript, Tailwind CSS 4, Drizzle ORM on Postgres (Neon in production), Better Auth with magic links, next-intl (English and Spanish), AI SDK 7 through Vercel AI Gateway, Vercel Blob for private work samples, Radix UI primitives and Phosphor icons. Tests use Vitest, Playwright and axe.

## Run locally

Requirements: Node.js 22, pnpm 10 and a Postgres database.

```bash
pnpm install
cp .env.example .env.local   # then fill in the values below
pnpm db:migrate
pnpm db:seed
pnpm dev
```

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | Postgres connection string |
| `BETTER_AUTH_SECRET` | 32 or more random bytes |
| `BETTER_AUTH_URL` | The app URL, for example `http://localhost:3000` |
| `DEMO_MODE` | `true` turns on `/demo` and the sample data banner |
| `AI_MODEL` | AI Gateway model id, for example `anthropic/claude-sonnet-5.5` |
| `AI_GATEWAY_API_KEY` | Local only; Vercel deployments use OIDC |
| `BLOB_READ_WRITE_TOKEN` | Optional locally; uploads fall back to the database |
| `RESEND_API_KEY`, `EMAIL_FROM` | Magic links and notices outside demo mode |
| `CRON_SECRET` | Protects `/api/cron/weekly` and `/api/cron/daily` |

Without an AI key the app still works: every AI button shows the fallback message and the manual path stays open. Set `AI_MOCK=true` to use a fixed local response instead.

## Checks

```bash
pnpm typecheck
pnpm lint
pnpm test        # unit tests; some use the database in TEST_DATABASE_URL
pnpm test:e2e    # builds the app and runs Playwright with axe on every route
pnpm check:copy  # fails on em dashes, arrows or all-caps copy
pnpm eval:ai     # 5 fixed cases per AI feature against the real model
```

## Privacy

The data is synthetic. Students choose who sees their record (City HR, Vendor Bridge employers, anyone with a link). Demographic answers are optional, never sent to AI and only shown as totals of 5 or more. Work samples are stored privately and served through a permission check. A real deployment needs FERPA and city HR review first.

## Credits

Built with these open-source projects, each under its own license: Next.js and React (MIT), Tailwind CSS (MIT), Drizzle ORM (Apache 2.0), Better Auth (MIT), next-intl (MIT), AI SDK (Apache 2.0), Radix UI (MIT), Phosphor Icons (MIT), Zod (MIT), pdf-lib (MIT), node-postgres (MIT), Vitest (MIT), Playwright (Apache 2.0) and axe-core (MPL 2.0). The Overpass typeface is under the SIL Open Font License.

Research sources for the public pages are linked on `/why`.

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthEndpoint } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins/magic-link";
import { Resend } from "resend";
import * as z from "zod";
import { db } from "./db";
import * as schema from "./db/schema";

export const isDemoMode = () => process.env.DEMO_MODE === "true";

async function sendMagicLinkEmail({ email, url }: { email: string; url: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(JSON.stringify({ event: "magic_link_not_sent", reason: "RESEND_API_KEY missing", email }));
    return;
  }
  const resend = new Resend(key);
  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "Teaching City <onboarding@resend.dev>",
    to: email,
    subject: "Sign in to Teaching City",
    text: `Sign in to Teaching City: ${url}\n\nThe sign-in link works for 15 minutes.`,
  });
}

/** Signs in as a seeded persona. Refuses unless DEMO_MODE is true (Section 7.2). */
const demoPersonas = () => ({
  id: "demo-personas",
  endpoints: {
    demoSignIn: createAuthEndpoint(
      "/demo/sign-in",
      { method: "POST", body: z.object({ email: z.string().email() }) },
      async (ctx) => {
        if (!isDemoMode()) throw new APIError("NOT_FOUND");
        const found = await ctx.context.internalAdapter.findUserByEmail(ctx.body.email);
        if (!found) throw new APIError("NOT_FOUND");
        const session = await ctx.context.internalAdapter.createSession(found.user.id);
        await setSessionCookie(ctx, { session, user: found.user });
        return ctx.json({ ok: true });
      },
    ),
  },
});

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined),
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(process.env.VERCEL_BRANCH_URL ? [`https://${process.env.VERCEL_BRANCH_URL}`] : []),
    ...(process.env.VERCEL_PROJECT_PRODUCTION_URL ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`] : []),
  ],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user: schema.user, session: schema.session, account: schema.account, verification: schema.verification },
  }),
  user: {
    additionalFields: {
      locale: { type: "string", required: false, defaultValue: "en", input: false },
    },
    changeEmail: { enabled: false },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    cookieCache: { enabled: false },
  },
  plugins: [
    magicLink({
      expiresIn: 60 * 15,
      sendMagicLink: ({ email, url }) => sendMagicLinkEmail({ email, url }),
    }),
    demoPersonas(),
    nextCookies(),
  ],
});

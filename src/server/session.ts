import "server-only";
import { eq } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "./auth";
import { db } from "./db";
import { memberships, organizations, user, type Role } from "./db/schema";

export const ROLE_COOKIE = "tc_role";

export const ROLE_HOME: Record<Role, string> = {
  student: "/s",
  preceptor: "/m",
  sponsor: "/m",
  city_coordinator: "/city",
  college_coordinator: "/college",
  vendor_recruiter: "/vendor",
};

export type Membership = {
  role: Role;
  organizationId: string;
  organizationType: "city" | "college" | "vendor";
  organizationName: string;
  title: string | null;
};

export type CurrentUser = {
  id: string;
  name: string;
  firstName: string;
  email: string;
  locale: "en" | "es";
  memberships: Membership[];
  roles: Role[];
  activeRole: Role | null;
};

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const [row] = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1);
  if (!row) return null;
  const rows = await db
    .select({
      role: memberships.role,
      organizationId: memberships.organizationId,
      organizationType: organizations.type,
      organizationName: organizations.name,
      title: memberships.title,
    })
    .from(memberships)
    .innerJoin(organizations, eq(organizations.id, memberships.organizationId))
    .where(eq(memberships.userId, row.id));
  const roles = [...new Set(rows.map((r) => r.role))];
  const preferred = (await cookies()).get(ROLE_COOKIE)?.value as Role | undefined;
  const activeRole = preferred && roles.includes(preferred) ? preferred : (roles[0] ?? null);
  return {
    id: row.id,
    name: row.name,
    firstName: row.name.split(" ")[0],
    email: row.email,
    locale: row.locale === "es" ? "es" : "en",
    memberships: rows,
    roles,
    activeRole,
  };
});

/** Redirects to sign-in without a session and to the no-role screen without memberships. */
export async function requireUser(): Promise<CurrentUser> {
  const current = await getCurrentUser();
  if (!current) redirect("/sign-in");
  if (current.roles.length === 0) redirect("/no-role");
  return current;
}

/** The signed-in user, who must hold one of the roles. Other users go to their own home. */
export async function requireRole(...allowed: Role[]): Promise<CurrentUser> {
  const current = await requireUser();
  const held = allowed.filter((r) => current.roles.includes(r));
  if (held.length === 0) redirect(ROLE_HOME[current.activeRole!]);
  return current;
}

export function homeFor(current: CurrentUser): string {
  return current.activeRole ? ROLE_HOME[current.activeRole] : "/no-role";
}

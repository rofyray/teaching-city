import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "../db";
import { openingInvites, openings, organizations, vendorInterest } from "../db/schema";

export async function getInvitesForPoolEntry(poolEntryId: string) {
  return db
    .select({ invite: openingInvites, opening: openings })
    .from(openingInvites)
    .innerJoin(openings, eq(openings.id, openingInvites.openingId))
    .where(eq(openingInvites.poolEntryId, poolEntryId))
    .orderBy(desc(openingInvites.invitedAt));
}

export async function getVendorRequestsForStudent(studentId: string) {
  return db
    .select({ interest: vendorInterest, vendorName: organizations.name })
    .from(vendorInterest)
    .innerJoin(organizations, eq(organizations.id, vendorInterest.vendorOrgId))
    .where(eq(vendorInterest.studentId, studentId))
    .orderBy(desc(vendorInterest.requestedAt));
}

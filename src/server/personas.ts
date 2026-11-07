import type { Role } from "./db/schema";

export type Persona = { key: string; email: string; role: Role; home: string; initials: string; line: string };

export const PERSONAS: Persona[] = [
  { key: "student", email: "amara.okafor@wsu.example.edu", role: "student", home: "/s", initials: "AO", line: "finance" },
  { key: "preceptor", email: "dana.ortiz@westbrook.example.gov", role: "preceptor", home: "/m", initials: "DO", line: "finance" },
  { key: "sponsor", email: "marcus.hill@westbrook.example.gov", role: "sponsor", home: "/m", initials: "MH", line: "finance" },
  { key: "city", email: "renee.carter@westbrook.example.gov", role: "city_coordinator", home: "/city", initials: "RC", line: "community" },
  { key: "college", email: "omar.patel@wsu.example.edu", role: "college_coordinator", home: "/college", initials: "OP", line: "tech" },
  { key: "vendor", email: "kim.nguyen@brightline.example.com", role: "vendor_recruiter", home: "/vendor", initials: "KN", line: "works" },
  { key: "completer", email: "luis.herrera@wsu.example.edu", role: "student", home: "/s/openings", initials: "LH", line: "works" },
];

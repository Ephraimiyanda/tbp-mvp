/**
 * Seed live demo professionals, students, Care Loop plans, and communities.
 * Usage: npm run seed:demo
 * Needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 */
import { seedDemoContent } from "../src/lib/seed-demo";

async function main() {
  const result = await seedDemoContent();
  console.log("Professionals");
  for (const p of result.professionals) console.log(" ", p.name, p.email);
  console.log("\nStudents (Care Loop plans ready)");
  for (const s of result.students) console.log(" ", s.name, s.email, "—", s.plan);
  if (result.extraPlans.length) {
    console.log("\nExisting accounts given a mock plan");
    for (const row of result.extraPlans) console.log(" ", row.student, "—", row.plan);
  }
  console.log("\nCommunities");
  for (const g of result.communities) console.log(" ", g.name);
  console.log("\nPassword for every demo account:", result.password);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

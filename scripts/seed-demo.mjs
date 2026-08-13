/**
 * Seed live demo professionals, nuggets, and communities.
 * Usage: node scripts/seed-demo.mjs
 * Needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 */
import { createClient } from "@supabase/supabase-js";

const DEMO_PASSWORD = "DemoPass123!";
const DEMO_PROFESSIONALS = [
  {
    email: "ada.okonkwo@myalo.demo",
    full_name: "Ada Okonkwo",
    credentials: "Licensed Clinical Psychologist · MSc",
    specialties: ["anxiety", "exams", "sleep"],
    bio: "I help students untangle exam panic and racing thoughts with practical CBT tools that fit a campus week.",
    approach: "Warm, structured, skills-first.",
    gender: "woman",
    tone: "warm",
    lgbtq_affirming: true,
    faith_sensitive: false,
    default_meet_url: "https://meet.google.com/lookup/myalo-ada-demo",
    nuggets: [
      {
        title: "Two-minute breath reset",
        body: "Before your next lecture: inhale for 4, hold for 4, exhale for 6. Repeat four times. Name one thing you can control today.",
      },
      {
        title: "Exam anxiety is not laziness",
        body: "Your nervous system is trying to protect you. Schedule a 25-minute focused block, then a real break — phones away for both.",
      },
    ],
  },
  {
    email: "chidi.mensah@myalo.demo",
    full_name: "Chidi Mensah",
    credentials: "Counseling Psychologist · LPC",
    specialties: ["mood", "homesickness", "firstgen"],
    bio: "First-gen and far-from-home journeys are my focus. We build belonging without erasing where you come from.",
    approach: "Gentle, affirming, story-aware.",
    gender: "man",
    tone: "gentle",
    lgbtq_affirming: true,
    faith_sensitive: true,
    default_meet_url: "https://meet.google.com/lookup/myalo-chidi-demo",
    nuggets: [
      {
        title: "Homesickness check-in",
        body: "Text one person from home something specific you noticed today — a meal, a joke, a tree. Specificity reconnects without spiraling.",
      },
      {
        title: "Low mood, small win",
        body: "Pick the smallest task that still counts: wash a cup, open one slide. Momentum beats motivation when energy is low.",
      },
    ],
  },
  {
    email: "zainab.ade@myalo.demo",
    full_name: "Zainab Adeyemi",
    credentials: "Therapist · LGBTQ+ affirming care",
    specialties: ["identity", "relationships", "anxiety"],
    bio: "Identity, orientation, and relationship stress deserve a room where you do not have to translate yourself.",
    approach: "Direct, affirming, collaborative.",
    gender: "woman",
    tone: "direct",
    lgbtq_affirming: true,
    faith_sensitive: false,
    default_meet_url: "https://meet.google.com/lookup/myalo-zainab-demo",
    nuggets: [
      {
        title: "You get to set the pace",
        body: "Coming out, dating, or setting boundaries with family — none of it has a campus deadline. We go at your speed.",
      },
      {
        title: "Conflict without collapse",
        body: "Try: “When X happens, I feel Y, and I need Z.” One sentence keeps the conversation from becoming a debate about your worth.",
      },
    ],
  },
];

const DEMO_COMMUNITIES = [
  {
    name: "Exam-season calm",
    description: "Peer check-ins for midterms and finals. Share tactics, not spoilers.",
    tags: ["exams", "anxiety", "study"],
    admin_email: "ada.okonkwo@myalo.demo",
  },
  {
    name: "First-gen circle",
    description: "For students carrying family hopes and new campus worlds at once.",
    tags: ["firstgen", "belonging"],
    admin_email: "chidi.mensah@myalo.demo",
  },
  {
    name: "Pride-safe peer space",
    description: "A confidential group for LGBTQ+ students and allies who want softer landings.",
    tags: ["identity", "lgbtq", "support"],
    admin_email: "zainab.ade@myalo.demo",
  },
];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

async function findUserIdByEmail(email) {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw error;
  return data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id ?? null;
}

async function ensureDemoUser({ email, full_name, role }) {
  let userId = await findUserIdByEmail(email);
  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name, role },
    });
    if (error) throw error;
    userId = data.user?.id ?? null;
  }
  if (!userId) throw new Error(`Could not create ${email}`);
  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: userId,
      email,
      full_name,
      role,
      consented_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (profileError) throw profileError;
  return userId;
}

const proIds = {};
for (const pro of DEMO_PROFESSIONALS) {
  const id = await ensureDemoUser({
    email: pro.email,
    full_name: pro.full_name,
    role: "professional",
  });
  proIds[pro.email] = id;
  const { error: proError } = await admin.from("professionals").upsert(
    {
      profile_id: id,
      credentials: pro.credentials,
      specialties: pro.specialties,
      bio: pro.bio,
      approach: pro.approach,
      gender: pro.gender,
      tone: pro.tone,
      lgbtq_affirming: pro.lgbtq_affirming,
      faith_sensitive: pro.faith_sensitive,
      default_meet_url: pro.default_meet_url,
      verified: true,
    },
    { onConflict: "profile_id" },
  );
  if (proError) throw proError;

  const { data: existingNuggets } = await admin.from("nuggets").select("title").eq("professional_id", id);
  const titles = new Set((existingNuggets ?? []).map((n) => n.title));
  for (const nugget of pro.nuggets) {
    if (titles.has(nugget.title)) continue;
    const { error } = await admin.from("nuggets").insert({
      professional_id: id,
      title: nugget.title,
      body: nugget.body,
    });
    if (error) throw error;
  }
  console.log("professional", pro.full_name, id);
}

for (const community of DEMO_COMMUNITIES) {
  const adminId = proIds[community.admin_email];
  const { data: existing } = await admin
    .from("groups")
    .select("id")
    .eq("name", community.name)
    .eq("created_by", adminId)
    .maybeSingle();
  if (existing?.id) {
    console.log("community exists", community.name, existing.id);
    continue;
  }
  const { data: group, error } = await admin
    .from("groups")
    .insert({
      name: community.name,
      description: community.description,
      tags: community.tags,
      created_by: adminId,
      member_cap: 40,
    })
    .select("id")
    .single();
  if (error) throw error;
  console.log("community", community.name, group.id);
}

console.log("\nDemo password for all professionals:", DEMO_PASSWORD);
console.log("Done.");

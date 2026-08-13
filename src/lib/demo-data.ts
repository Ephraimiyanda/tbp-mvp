/** Deterministic demo accounts for live presentations. Password: DemoPass123! */
export const DEMO_PASSWORD = "DemoPass123!";

export const DEMO_PROFESSIONALS = [
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
] as const;

export const DEMO_COMMUNITIES = [
  {
    key: "exam-season",
    name: "Exam-season calm",
    description: "Peer check-ins for midterms and finals. Share tactics, not spoilers.",
    tags: ["exams", "anxiety", "study"],
    admin_email: "ada.okonkwo@myalo.demo",
  },
  {
    key: "first-gen",
    name: "First-gen circle",
    description: "For students carrying family hopes and new campus worlds at once.",
    tags: ["firstgen", "belonging"],
    admin_email: "chidi.mensah@myalo.demo",
  },
  {
    key: "pride-safe",
    name: "Pride-safe peer space",
    description: "A confidential group for LGBTQ+ students and allies who want softer landings.",
    tags: ["identity", "lgbtq", "support"],
    admin_email: "zainab.ade@myalo.demo",
  },
] as const;

/** Student plan demo price (Paystack uses kobo). ₦5,000.00 */
export const DEMO_PLAN_AMOUNT_KOBO = 500_000;

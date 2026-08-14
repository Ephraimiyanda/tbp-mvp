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

export type DemoLoopExercise = {
  title: string;
  instructions: string;
  resource_url?: string | null;
  completed?: boolean;
  stuck_question?: string | null;
};

export type DemoStudent = {
  email: string;
  full_name: string;
  university: string;
  year_of_study: string;
  professional_email: string;
  community_name: string;
  concerns: string[];
  communication: "message" | "video";
  session_type: "chat" | "video";
  counselor_style: string;
  tone: string;
  pref_gender: string;
  lgbtq_affirming: boolean;
  faith_sensitive: boolean;
  plan_title: string;
  session_notes: string;
  exercises: DemoLoopExercise[];
};

/** Demo students (password: DemoPass123!) matched to the three professionals, with Care Loop plans. */
export const DEMO_STUDENTS: DemoStudent[] = [
  {
    email: "amara.bello@myalo.demo",
    full_name: "Amara Bello",
    university: "University of Lagos",
    year_of_study: "200-level",
    professional_email: "ada.okonkwo@myalo.demo",
    community_name: "Exam-season calm",
    concerns: ["exams", "anxiety", "sleep"],
    communication: "message",
    session_type: "chat",
    counselor_style: "skills",
    tone: "warm",
    pref_gender: "woman",
    lgbtq_affirming: true,
    faith_sensitive: false,
    plan_title: "After midterms — settle the week",
    session_notes:
      "Exam panic before statistics. Sleep is short. We practised a 4-4-6 breath and parked two worries she cannot solve tonight.",
    exercises: [
      {
        title: "Two-minute breath reset",
        instructions:
          "Sit or stand still. Inhale for 4, hold for 4, exhale for 6. Repeat four times. Then name one thing you can control before the next lecture.",
        completed: true,
      },
      {
        title: "Worry parking lot",
        instructions:
          "Write three worries on paper. Circle the one you can act on today. Park the other two until your next session — you do not have to solve them tonight.",
        completed: true,
      },
      {
        title: "25-minute focus block",
        instructions:
          "Pick one slide deck or problem set. Phone in another room. Work for 25 minutes, then take a real 5-minute break. Log what you finished, not what you skipped.",
        completed: true,
      },
      {
        title: "Exam-night shutdown",
        instructions:
          "90 minutes before bed: no new material. Write a 3-line plan for tomorrow morning, dim lights, and put the notes out of reach.",
        stuck_question: "I keep opening the slides even after I said I would stop. What do I do instead?",
      },
      {
        title: "Same wake time",
        instructions:
          "Pick a wake time and keep it for the next three mornings, even after a late night. No extra naps longer than 20 minutes.",
      },
    ],
  },
  {
    email: "tunde.okafor@myalo.demo",
    full_name: "Tunde Okafor",
    university: "University of Ibadan",
    year_of_study: "100-level",
    professional_email: "chidi.mensah@myalo.demo",
    community_name: "First-gen circle",
    concerns: ["mood", "homesickness", "firstgen"],
    communication: "video",
    session_type: "video",
    counselor_style: "listening",
    tone: "gentle",
    pref_gender: "man",
    lgbtq_affirming: true,
    faith_sensitive: true,
    plan_title: "Small wins until we meet again",
    session_notes:
      "Low energy and missing home. Family pressure about grades. We named two campus footholds and one person to text something specific.",
    exercises: [
      {
        title: "Smallest possible win",
        instructions:
          "Choose one tiny task that still counts (wash a cup, open one slide). Do only that. Message yourself what you completed.",
        completed: true,
      },
      {
        title: "Specific check-in",
        instructions:
          "Text one person from home something specific you noticed today — a meal, a joke, a tree. Specificity reconnects without spiraling.",
        completed: true,
      },
      {
        title: "Belonging note",
        instructions:
          "List two places on campus where you already have a foothold (a class, a friend, a corner of the library). Visit one of them this week on purpose.",
      },
      {
        title: "Outside for ten",
        instructions:
          "Walk outside for ten minutes without headphones. Notice five things you can see. This is not a productivity hack — it is a nervous-system reset.",
      },
    ],
  },
  {
    email: "kemi.adewale@myalo.demo",
    full_name: "Kemi Adewale",
    university: "Obafemi Awolowo University",
    year_of_study: "300-level",
    professional_email: "zainab.ade@myalo.demo",
    community_name: "Pride-safe peer space",
    concerns: ["identity", "relationships", "anxiety"],
    communication: "message",
    session_type: "chat",
    counselor_style: "collaborative",
    tone: "direct",
    pref_gender: "woman",
    lgbtq_affirming: true,
    faith_sensitive: false,
    plan_title: "Your pace, one boundary",
    session_notes:
      "Family questions about dating. She does not owe a timeline. We drafted one sentence she can practise without sending.",
    exercises: [
      {
        title: "Pace permission",
        instructions:
          "Write one sentence: “I get to set the pace on ___.” Keep it somewhere private. You do not have to act on it this week.",
        completed: true,
      },
      {
        title: "One-sentence boundary",
        instructions:
          "Draft: “When X happens, I feel Y, and I need Z.” Practice it once out loud. You do not have to send it yet.",
        stuck_question: "Every version sounds either too soft or like I am picking a fight.",
      },
      {
        title: "Between-session check-in",
        instructions:
          "Once before the next session, jot what felt heavier and what felt lighter this week. Bring the note — you do not need a speech.",
      },
      {
        title: "Body-first pause",
        instructions:
          "When you notice spinning thoughts, put both feet on the floor and feel the contact for 30 seconds before you decide what to do next.",
      },
    ],
  },
];

/** Fallback Care Loop used for any other active student (e.g. a live demo account). */
export const DEMO_FALLBACK_PLAN: { title: string; notes: string; exercises: DemoLoopExercise[] } = {
  title: "Between this session and the next",
  notes: "First check-in. Low mood and racing thoughts. Keep the next week small and specific.",
  exercises: [
    {
      title: "Smallest possible win",
      instructions:
        "Choose one tiny task that still counts (wash a cup, open one slide). Do only that. Message yourself what you completed.",
      completed: true,
    },
    {
      title: "Two-minute breath reset",
      instructions:
        "Sit or stand still. Inhale for 4, hold for 4, exhale for 6. Repeat four times. Then name one thing you can control before the next lecture.",
      completed: true,
    },
    {
      title: "Worry parking lot",
      instructions:
        "Write three worries on paper. Circle the one you can act on today. Park the other two until your next session — you do not have to solve them tonight.",
      stuck_question: "I circled all three. How do I pick only one?",
    },
    {
      title: "Outside for ten",
      instructions:
        "Walk outside for ten minutes without headphones. Notice five things you can see. This is not a productivity hack — it is a nervous-system reset.",
    },
    {
      title: "Between-session check-in",
      instructions:
        "Once before the next session, jot what felt heavier and what felt lighter this week. Bring the note — you do not need a speech.",
    },
  ],
};

/** Student plan demo price (Paystack uses kobo). ₦5,000.00 */
export const DEMO_PLAN_AMOUNT_KOBO = 500_000;

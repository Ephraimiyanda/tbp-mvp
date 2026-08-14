export type LoopPlanStatus = "draft" | "published" | "archived";

export type LoopExercise = {
  id: string;
  plan_id: string;
  sort_order: number;
  title: string;
  instructions: string;
  resource_url: string | null;
  completed_at?: string | null;
  stuck?: boolean;
};

export type LoopPlan = {
  id: string;
  session_id: string;
  subscription_id: string;
  student_id: string;
  professional_id: string;
  status: LoopPlanStatus;
  title: string;
  published_at: string | null;
  created_at: string;
  session_at?: string | null;
  exercises: LoopExercise[];
};

export type LoopAssist = {
  id: string;
  exercise_id: string;
  question: string | null;
  suggestion: string;
  created_at: string;
};

export type ExerciseDraft = {
  id?: string;
  title: string;
  instructions: string;
  resource_url?: string | null;
};

const SUGGESTIONS: Record<string, ExerciseDraft[]> = {
  anxiety: [
    {
      title: "Two-minute breath reset",
      instructions:
        "Sit or stand still. Inhale for 4, hold for 4, exhale for 6. Repeat four times. Then name one thing you can control before the next lecture.",
    },
    {
      title: "Worry parking lot",
      instructions:
        "Write three worries on paper. Circle the one you can act on today. Park the other two until your next session — you do not have to solve them tonight.",
    },
  ],
  exams: [
    {
      title: "25-minute focus block",
      instructions:
        "Pick one slide deck or problem set. Phone in another room. Work for 25 minutes, then take a real 5-minute break. Log what you finished, not what you skipped.",
    },
    {
      title: "Exam-night shutdown",
      instructions:
        "90 minutes before bed: no new material. Write a 3-line plan for tomorrow morning, dim lights, and put the notes out of reach.",
    },
  ],
  mood: [
    {
      title: "Smallest possible win",
      instructions:
        "Choose one tiny task that still counts (wash a cup, open one slide). Do only that. Message yourself what you completed.",
    },
    {
      title: "Outside for ten",
      instructions:
        "Walk outside for ten minutes without headphones. Notice five things you can see. This is not a productivity hack — it is a nervous-system reset.",
    },
  ],
  sleep: [
    {
      title: "Same wake time",
      instructions:
        "Pick a wake time and keep it for the next three mornings, even after a late night. No extra naps longer than 20 minutes.",
    },
  ],
  homesickness: [
    {
      title: "Specific check-in",
      instructions:
        "Text one person from home something specific you noticed today — a meal, a joke, a tree. Specificity reconnects without spiraling.",
    },
  ],
  identity: [
    {
      title: "Pace permission",
      instructions:
        "Write one sentence: “I get to set the pace on ___.” Keep it somewhere private. You do not have to act on it this week.",
    },
  ],
  relationships: [
    {
      title: "One-sentence boundary",
      instructions:
        "Draft: “When X happens, I feel Y, and I need Z.” Practice it once out loud. You do not have to send it yet.",
    },
  ],
  firstgen: [
    {
      title: "Belonging note",
      instructions:
        "List two places on campus where you already have a foothold (a class, a friend, a corner of the library). Visit one of them this week on purpose.",
    },
  ],
  grief: [
    {
      title: "Name the wave",
      instructions:
        "When a wave hits, name it out loud (“this is missing them”). Sit with it for two minutes without fixing it. Then do one ordinary next step.",
    },
  ],
};

const DEFAULT_SUGGESTIONS: ExerciseDraft[] = [
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
];

export function suggestExercises(input: {
  concerns?: string[];
  notes?: string | null;
}): ExerciseDraft[] {
  const picks: ExerciseDraft[] = [];
  const seen = new Set<string>();
  const concerns = input.concerns ?? [];
  const notes = (input.notes ?? "").toLowerCase();

  for (const concern of concerns) {
    for (const ex of SUGGESTIONS[concern] ?? []) {
      if (seen.has(ex.title)) continue;
      seen.add(ex.title);
      picks.push(ex);
    }
  }

  if (/sleep|insomnia|tired/.test(notes)) {
    for (const ex of SUGGESTIONS.sleep) {
      if (!seen.has(ex.title)) {
        seen.add(ex.title);
        picks.push(ex);
      }
    }
  }
  if (/exam|test|midterm|final/.test(notes)) {
    for (const ex of SUGGESTIONS.exams) {
      if (!seen.has(ex.title)) {
        seen.add(ex.title);
        picks.push(ex);
      }
    }
  }

  for (const ex of DEFAULT_SUGGESTIONS) {
    if (picks.length >= 4) break;
    if (!seen.has(ex.title)) {
      seen.add(ex.title);
      picks.push(ex);
    }
  }

  return picks.slice(0, 4);
}

export function assistOnExercise(exercise: { title: string; instructions: string }, question?: string) {
  const q = (question ?? "").trim();
  const title = exercise.title.toLowerCase();
  let suggestion =
    "Try shrinking the task until it takes under two minutes. Completing a sliver still counts as progress toward your next session — your professional will see the full picture then.";

  if (title.includes("breath") || title.includes("pause")) {
    suggestion =
      "If counting feels mechanical, drop the numbers. Breathe out slightly longer than you breathe in, three times. That is enough. You are not failing the exercise by keeping it smaller.";
  } else if (title.includes("focus") || title.includes("25")) {
    suggestion =
      "If 25 minutes is too much, start a 10-minute timer on one paragraph or one problem. When it rings, you can stop. Momentum beats a perfect block.";
  } else if (title.includes("boundary") || title.includes("sentence")) {
    suggestion =
      "You do not have to send the sentence. Reading it once to yourself is the exercise. If wording sticks, try: “I need a pause before I answer.”";
  } else if (title.includes("win") || title.includes("smallest")) {
    suggestion =
      "Pick something already almost done. Finishing leftover rice or opening the assignment tab counts. The point is contact with action, not a heroic list.";
  } else if (title.includes("sleep") || title.includes("wake")) {
    suggestion =
      "If you already missed the wake time, do not “catch up” with a long nap. Get up at the next reasonable hour and keep tonight’s shutdown. One miss does not reset the week.";
  }

  if (q) {
    suggestion += ` You asked: “${q.slice(0, 180)}”. Bring that exact sticking point to your next session — this assist is a bridge, not a replacement for your professional.`;
  } else {
    suggestion += " This is a bridge until your next session, not a replacement for your professional.";
  }

  return suggestion;
}

export function progressRatio(exercises: LoopExercise[]) {
  if (!exercises.length) return { done: 0, total: 0, pct: 0 };
  const done = exercises.filter((e) => e.completed_at).length;
  return { done, total: exercises.length, pct: Math.round((done / exercises.length) * 100) };
}

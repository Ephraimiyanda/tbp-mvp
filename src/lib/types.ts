export const CONCERNS = [
  { id: "exams", label: "Exam / academic stress" },
  { id: "anxiety", label: "Anxiety" },
  { id: "mood", label: "Low mood" },
  { id: "homesickness", label: "Homesickness / belonging" },
  { id: "relationships", label: "Relationships or family" },
  { id: "identity", label: "Identity, orientation, or gender" },
  { id: "grief", label: "Grief or loss" },
  { id: "sleep", label: "Sleep" },
  { id: "firstgen", label: "First-gen / family pressure" },
] as const;

export type ConcernId = (typeof CONCERNS)[number]["id"];

export const CARE_PLANS: Record<
  ConcernId,
  { weeks: number; sessions: number; label: string }
> = {
  exams: { weeks: 4, sessions: 4, label: "Exam-season support" },
  sleep: { weeks: 6, sessions: 6, label: "Sleep reset" },
  homesickness: { weeks: 6, sessions: 6, label: "Settling in" },
  anxiety: { weeks: 8, sessions: 8, label: "Anxiety programme" },
  relationships: { weeks: 8, sessions: 8, label: "Relationship work" },
  firstgen: { weeks: 8, sessions: 8, label: "First-gen support" },
  identity: { weeks: 10, sessions: 8, label: "Identity-affirming care" },
  mood: { weeks: 12, sessions: 10, label: "Mood recovery" },
  grief: { weeks: 12, sessions: 10, label: "Grief support" },
};

export function planForConcerns(concerns: string[]) {
  let best = CARE_PLANS.anxiety;
  let issue: ConcernId = "anxiety";
  for (const c of concerns) {
    if (c === "crisis") continue;
    const plan = CARE_PLANS[c as ConcernId];
    if (plan && plan.weeks >= best.weeks) {
      best = plan;
      issue = c as ConcernId;
    }
  }
  return { issue, ...best };
}

export type Profile = {
  id: string;
  role: "student" | "professional";
  full_name: string;
  email: string | null;
  university: string | null;
  year_of_study: string | null;
  chosen_name: string | null;
  gender: string | null;
  consented_at: string | null;
};

export type Professional = {
  profile_id: string;
  credentials: string | null;
  specialties: string[];
  bio: string | null;
  approach: string | null;
  gender: string | null;
  tone: string | null;
  lgbtq_affirming: boolean;
  faith_sensitive: boolean;
  default_meet_url: string | null;
  verified: boolean;
  profiles?: Profile;
};

export type Intake = {
  id: string;
  student_id: string;
  concerns: string[];
  prior_counseling: string | null;
  counselor_style: string | null;
  tone: string | null;
  communication: string | null;
  pref_gender: string | null;
  lgbtq_affirming: boolean;
  faith_sensitive: boolean;
};

export type MatchRow = {
  id: string;
  student_id: string;
  professional_id: string;
  status: "proposed" | "declined" | "subscribed" | "ended";
  reasons: string[];
};

export type Subscription = {
  id: string;
  student_id: string;
  professional_id: string;
  match_id: string | null;
  status: "pending" | "active" | "cancelled";
  plan: string;
  started_at: string;
  session_type?: "chat" | "video" | null;
  meet_url?: string | null;
};

export type CarePlan = {
  id: string;
  subscription_id: string;
  primary_issue: string;
  duration_weeks: number;
  session_target: number;
  started_at: string;
};

export type SessionRow = {
  id: string;
  subscription_id: string;
  student_id: string;
  professional_id: string;
  scheduled_at: string;
  duration_min: number;
  status: "scheduled" | "released" | "completed" | "cancelled";
  modality?: "video" | "chat";
  notes_professional: string | null;
  meet_released_at: string | null;
};

export type Nugget = {
  id: string;
  professional_id: string;
  title: string;
  body: string;
  created_at: string;
};

export type GroupRow = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  created_by: string;
  member_cap: number;
  created_at: string;
};

export type GroupMember = {
  group_id: string;
  profile_id: string;
  role: "admin" | "member";
  display_name: string | null;
  joined_at: string;
};

export type Checkin = {
  id: string;
  group_id: string;
  profile_id: string;
  mood: number;
  note: string | null;
  created_at: string;
};

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "M";
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function concernLabel(id: string) {
  return CONCERNS.find((c) => c.id === id)?.label ?? id;
}

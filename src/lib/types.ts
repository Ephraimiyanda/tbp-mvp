export type Path = "counseling" | "peer" | "friend";

export type Gender = "woman" | "man" | "nonbinary" | "unspecified";

export type Concern =
  | "exams"
  | "anxiety"
  | "mood"
  | "homesickness"
  | "relationships"
  | "identity"
  | "grief"
  | "sleep"
  | "firstgen"
  | "crisis";

export type Message = {
  id: string;
  from: "student" | "counselor";
  text: string;
  at: string;
};

export type SessionState = {
  path: Path;
  gender?: Gender;
  year?: string;
  concerns: Concern[];
  priorCounseling?: "yes" | "no" | "unsure";
  counselorStyle?: "listens" | "skills" | "challenges";
  tone?: "gentle" | "direct";
  communication?: "message" | "video" | "mix";
  prefGender?: "woman" | "man" | "any";
  lgbtqAffirming?: boolean;
  faithSensitive?: boolean;
  firstName?: string;
  email?: string;
  consented?: boolean;
  counselorId?: string;
  skippedCounselorIds: string[];
  peerGroupId?: string;
  messages: Message[];
  bookedSlot?: { label: string };
};

export type Counselor = {
  id: string;
  name: string;
  credentials: string;
  gender: "woman" | "man" | "nonbinary";
  initials: string;
  color: string;
  specialties: Concern[];
  tone: "gentle" | "direct";
  lgbtqAffirming: boolean;
  faithSensitive: boolean;
  bio: string;
  approach: string;
  slots: string[];
};

export type PeerGroup = {
  id: string;
  name: string;
  tag: Concern;
  size: number;
  cap: number;
  blurb: string;
};

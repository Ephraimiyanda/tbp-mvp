import { counselors } from "./counselors";
import type { SessionState } from "./types";

export function rankCounselors(session: SessionState) {
  const skipped = new Set(session.skippedCounselorIds);

  const scored = counselors
    .filter((c) => !skipped.has(c.id))
    .map((c) => {
      let score = 0;
      for (const concern of session.concerns) {
        if (concern === "crisis") continue;
        if (c.specialties.includes(concern)) score += 3;
      }
      if (session.prefGender && session.prefGender !== "any") {
        if (c.gender === session.prefGender) score += 4;
        else score -= 8;
      }
      if (session.lgbtqAffirming && c.lgbtqAffirming) score += 3;
      if (session.lgbtqAffirming && !c.lgbtqAffirming) score -= 6;
      if (session.faithSensitive && c.faithSensitive) score += 3;
      if (session.tone && c.tone === session.tone) score += 1;
      if (session.counselorStyle === "challenges" && c.tone === "direct") score += 1;
      if (session.counselorStyle === "listens" && c.tone === "gentle") score += 1;
      return { counselor: c, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored.map((s) => s.counselor);
}

export function pickMatch(session: SessionState) {
  return rankCounselors(session)[0] ?? null;
}

export function matchReasons(session: SessionState, counselorId: string) {
  const counselor = counselors.find((c) => c.id === counselorId);
  if (!counselor) return [];
  const reasons: string[] = [];
  const overlap = counselor.specialties.filter((s) => session.concerns.includes(s));
  const labels: Record<string, string> = {
    exams: "exam stress",
    anxiety: "anxiety",
    mood: "low mood",
    homesickness: "homesickness",
    relationships: "relationships",
    identity: "identity",
    grief: "grief",
    sleep: "sleep",
    firstgen: "first-gen pressure",
  };
  if (overlap.length) {
    reasons.push(
      `Works with ${overlap
        .slice(0, 2)
        .map((id) => labels[id] ?? id)
        .join(" and ")}`,
    );
  }
  if (session.prefGender && session.prefGender !== "any" && counselor.gender === session.prefGender) {
    reasons.push("Matches your counselor gender preference");
  }
  if (session.lgbtqAffirming && counselor.lgbtqAffirming) {
    reasons.push("LGBTQ+ affirming");
  }
  if (session.faithSensitive && counselor.faithSensitive) {
    reasons.push("Faith-sensitive when you want that");
  }
  if (session.tone && counselor.tone === session.tone) {
    reasons.push(counselor.tone === "gentle" ? "A gentler style" : "A more direct style");
  }
  if (!reasons.length) reasons.push("Available in this prototype network and a solid starting fit");
  return reasons.slice(0, 3);
}

import type { Intake, Professional } from "./types";
import { concernLabel } from "./types";

export function rankProfessionals(intake: Intake, professionals: Professional[]) {
  return professionals
    .map((pro) => {
      let score = 0;
      for (const concern of intake.concerns) {
        if (pro.specialties.includes(concern)) score += 3;
      }
      if (intake.pref_gender && intake.pref_gender !== "any") {
        if (pro.gender === intake.pref_gender) score += 4;
        else score -= 8;
      }
      if (intake.lgbtq_affirming && pro.lgbtq_affirming) score += 3;
      if (intake.lgbtq_affirming && !pro.lgbtq_affirming) score -= 6;
      if (intake.faith_sensitive && pro.faith_sensitive) score += 3;
      if (intake.tone && pro.tone === intake.tone) score += 1;
      if (intake.counselor_style === "challenges" && pro.tone === "direct") score += 1;
      if (intake.counselor_style === "listens" && pro.tone === "gentle") score += 1;
      return { professional: pro, score };
    })
    .sort((a, b) => b.score - a.score);
}

export function matchReasons(intake: Intake, pro: Professional) {
  const reasons: string[] = [];
  const overlap = pro.specialties.filter((s) => intake.concerns.includes(s));
  if (overlap.length) {
    reasons.push(`Works with ${overlap.slice(0, 2).map(concernLabel).join(" and ")}`);
  }
  if (intake.pref_gender && intake.pref_gender !== "any" && pro.gender === intake.pref_gender) {
    reasons.push("Matches your gender preference");
  }
  if (intake.lgbtq_affirming && pro.lgbtq_affirming) reasons.push("LGBTQ+ affirming");
  if (intake.faith_sensitive && pro.faith_sensitive) reasons.push("Faith-sensitive");
  if (intake.tone && pro.tone === intake.tone) {
    reasons.push(pro.tone === "gentle" ? "A gentler style" : "A more direct style");
  }
  if (!reasons.length) reasons.push("Available on Myalo and a solid starting fit");
  return reasons.slice(0, 3);
}

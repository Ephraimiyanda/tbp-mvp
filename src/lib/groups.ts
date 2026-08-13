import type { Concern, PeerGroup } from "./types";

export const peerGroups: PeerGroup[] = [
  {
    id: "exam-circle",
    name: "Exam season circle",
    tag: "exams",
    size: 9,
    cap: 12,
    blurb: "Weekly check-ins for students drowning in continuous assessment, finals, or the fear of falling behind.",
  },
  {
    id: "first-gen",
    name: "First-gen room",
    tag: "firstgen",
    size: 7,
    cap: 12,
    blurb: "For students who are the first in their family at university — translating home and campus to each other.",
  },
  {
    id: "affirming",
    name: "Affirming space",
    tag: "identity",
    size: 8,
    cap: 12,
    blurb: "LGBTQ+ affirming peer group. Pseudonyms welcome; the platform keeps real identity for safety only.",
  },
];

export function suggestGroup(concerns: Concern[]) {
  const ranked = peerGroups
    .map((g) => ({
      group: g,
      score: concerns.includes(g.tag) ? 2 : concerns.length ? 0 : 1,
    }))
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.group ?? peerGroups[0];
}

export function getGroup(id: string) {
  return peerGroups.find((g) => g.id === id);
}

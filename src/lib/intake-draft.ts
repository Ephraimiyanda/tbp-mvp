export type IntakeDraft = {
  gender?: string;
  year?: string;
  university?: string;
  concerns: string[];
  prior?: string;
  style?: string;
  tone?: string;
  communication?: string;
  prefGender?: string;
  lgbtq?: boolean;
  faith?: boolean;
  consented?: boolean;
  fullName?: string;
};

const KEY = "myalo-intake-draft";

export function emptyDraft(): IntakeDraft {
  return { concerns: [] };
}

export function loadDraft(): IntakeDraft {
  if (typeof window === "undefined") return emptyDraft();
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return emptyDraft();
    return { ...emptyDraft(), ...(JSON.parse(raw) as IntakeDraft) };
  } catch {
    return emptyDraft();
  }
}

export function saveDraft(draft: IntakeDraft) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(KEY, JSON.stringify(draft));
}

export function clearDraft() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(KEY);
}

export function draftIsReady(draft: IntakeDraft) {
  return Boolean(draft.consented && draft.concerns.length && draft.university?.trim() && draft.year);
}

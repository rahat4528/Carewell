export interface ClinicalNoteInput {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  noteType?: string;
}

export function validateNoteCanBeModified(isSigned: boolean): { canModify: boolean; error?: string } {
  if (isSigned) {
    return {
      canModify: false,
      error: 'NOTE_LOCKED: Signed clinical notes are legally sealed and permanently immutable. Create an addendum instead.'
    };
  }
  return { canModify: true };
}

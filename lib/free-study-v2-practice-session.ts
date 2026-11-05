/**
 * Choose only server-verified, account-entitled questions for a Free practice.
 * Claims are idempotent and serialized in PostgreSQL by claimFreeStudyUnlock.
 * Once the first NEW question is denied, retain access to previously unlocked
 * questions without trying to consume further new grants.
 */
export async function reserveFreeQuestionSession(input: {
  candidateIds: readonly string[];
  maxQuestions: number;
  unlockedIds: ReadonlySet<string>;
  claim: (questionId: string) => Promise<boolean>;
}): Promise<{ questionIds: string[]; exhausted: boolean }> {
  const questionIds: string[] = [];
  const seen = new Set<string>();
  let exhausted = false;
  for (const id of input.candidateIds) {
    if (questionIds.length >= input.maxQuestions) break;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    if (input.unlockedIds.has(id)) {
      questionIds.push(id);
      continue;
    }
    if (exhausted) continue;
    if (await input.claim(id)) {
      questionIds.push(id);
    } else {
      exhausted = true;
    }
  }
  return { questionIds, exhausted };
}

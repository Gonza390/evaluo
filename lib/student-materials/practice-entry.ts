/** Source of a transition into the PDF's own Ejercicios tab (not the external simulador). */
export type PracticeEntryPoint = 'tab' | 'summary_chapter' | 'summary_popup';
export type PracticeEntrySource = 'direct_tab' | 'topic_practice' | 'summary_popup' | 'resumed_draft';

export function resolvePracticeEntrySource(entry: PracticeEntryPoint): PracticeEntrySource {
  switch (entry) {
    case 'summary_popup': return 'summary_popup';
    case 'summary_chapter': return 'topic_practice';
    default: return 'direct_tab';
  }
}

/** General practices are selected from the Ejercicios tab; topic practices start immediately. */
export function practiceScope(topicSectionIndex: number | undefined): 'general' | 'topic' {
  return topicSectionIndex === undefined ? 'general' : 'topic';
}

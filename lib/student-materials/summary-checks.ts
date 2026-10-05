import type {
  PedagogicalArtifacts,
  PedagogicalReference,
  StudyQuestion,
} from '@/lib/student-materials/pedagogy';
import type { StudySummarySection } from '@/lib/student-materials/types';

const STOP_WORDS = new Set([
  'para',
  'como',
  'este',
  'esta',
  'estos',
  'estas',
  'desde',
  'sobre',
  'entre',
  'segun',
  'tema',
  'material',
  'capitulo',
  'concepto',
  'conceptos',
  'idea',
  'ideas',
  'parte',
  'puede',
  'pueden',
  'tambien',
  'donde',
  'cuando',
  'porque',
  'cada',
  'solo',
  'una',
  'uno',
  'unos',
  'unas',
  'del',
  'las',
  'los',
  'que',
  'con',
  'por',
  'sus',
]);

const DIRECT_RECOGNITION_PATTERNS = [
  /^segun el pdf/i,
  /^segun el material/i,
  /que describe correctamente/i,
  /cual de estas afirmaciones representa mejor/i,
  /que significa/i,
];

function clean(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function normalize(value: string) {
  return clean(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ');
}

function words(value: string) {
  return new Set(
    normalize(value)
      .split(/\s+/)
      .filter((word) => word.length >= 4 && !STOP_WORDS.has(word))
  );
}

function optionWords(value: string) {
  return new Set(
    normalize(value)
      .split(/\s+/)
      .filter((word) => word.length >= 2)
  );
}

function sharedWordCount(left: Set<string>, right: Set<string>) {
  let count = 0;
  for (const word of left) {
    if (right.has(word)) count += 1;
  }
  return count;
}

function sentenceCandidates(body: string) {
  return body
    .split(/(?<=[.!?])\s+|\n+/)
    .map(clean)
    .filter((sentence) => sentence.length >= 35)
    .slice(0, 4);
}

function truncate(value: string, max = 155) {
  const text = clean(value);
  if (text.length <= max) return text;
  const partial = text.slice(0, max);
  const cut = partial.lastIndexOf(' ');
  return `${partial.slice(0, cut > 80 ? cut : max).trim()}…`;
}

function rotateCorrectOption(correct: string, distractors: string[], seed: number) {
  const unique = Array.from(new Set(distractors.map((item) => clean(item))))
    .filter((item) => item && normalize(item) !== normalize(correct))
    .slice(0, 3);
  const options = [...unique];
  const position = Math.min(seed % (options.length + 1), options.length);
  options.splice(position, 0, correct);
  return options;
}

function hasNegation(value: string) {
  return /\b(no|sin|nunca|ningun|ninguna|ninguno)\b/.test(normalize(value));
}

function containmentSimilarity(left: string, right: string) {
  const leftWords = optionWords(left);
  const rightWords = optionWords(right);
  if (leftWords.size === 0 || rightWords.size === 0) return 0;

  const shared = sharedWordCount(leftWords, rightWords);
  return shared / Math.min(leftWords.size, rightWords.size);
}

function hasNearDuplicateOptions(options: string[]) {
  for (let left = 0; left < options.length; left += 1) {
    for (let right = left + 1; right < options.length; right += 1) {
      const leftOption = options[left] ?? '';
      const rightOption = options[right] ?? '';

      if (
        containmentSimilarity(leftOption, rightOption) >= 0.86 &&
        hasNegation(leftOption) === hasNegation(rightOption)
      ) {
        return true;
      }
    }
  }
  return false;
}

function isDirectRecognitionPrompt(prompt: string) {
  const normalizedPrompt = normalize(prompt);
  return DIRECT_RECOGNITION_PATTERNS.some((pattern) => pattern.test(normalizedPrompt));
}

export type SummaryCheckQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
  topic: string;
  reference: PedagogicalReference;
};

export type SummaryCheckPlanItem = {
  chapterIndex: number;
  chapterTitle: string;
  questions: [SummaryCheckQuestion, SummaryCheckQuestion];
};

type CandidateOrigin = 'artifact' | 'flashcard' | 'summary';

type Candidate = SummaryCheckQuestion & {
  sourceText: string;
  level: 'recordar' | 'comprender' | 'aplicar';
  kind?: StudyQuestion['kind'];
  origin: CandidateOrigin;
  directRecognition: boolean;
};

function hasUsableMultipleChoice(question: StudyQuestion) {
  if (question.type !== 'multiple_choice' || question.options.length < 3) return false;

  const normalizedOptions = question.options.map(normalize).filter(Boolean);
  if (new Set(normalizedOptions).size !== normalizedOptions.length) return false;

  const normalizedAnswer = normalize(question.answer);
  if (!normalizedAnswer || !normalizedOptions.includes(normalizedAnswer)) return false;

  if (hasNearDuplicateOptions(question.options)) return false;

  return true;
}

function fromStudyQuestion(question: StudyQuestion): Candidate | null {
  if (!hasUsableMultipleChoice(question)) return null;

  return {
    id: `artifact:${question.id}`,
    prompt: question.prompt,
    options: question.options,
    answer: question.answer,
    explanation: question.explanation,
    topic: question.topic || question.reference.sectionTitle || 'Tema del resumen',
    reference: question.reference,
    sourceText: [
      question.topic,
      question.prompt,
      question.answer,
      question.explanation,
      question.reference.sectionTitle,
      question.reference.excerpt,
    ]
      .filter(Boolean)
      .join(' '),
    level: question.level,
    kind: question.kind,
    origin: 'artifact',
    directRecognition: isDirectRecognitionPrompt(question.prompt),
  };
}

function buildFlashcardCandidates(artifacts: PedagogicalArtifacts): Candidate[] {
  return artifacts.flashcards
    .map((card, index) => {
      const correct = truncate(card.back, 150);
      const distractors = artifacts.flashcards
        .filter((_, candidateIndex) => candidateIndex !== index)
        .map((candidate) => truncate(candidate.back, 150));

      const options = rotateCorrectOption(correct, distractors, index);
      if (options.length < 3 || hasNearDuplicateOptions(options)) return null;

      const rawFront = clean(card.front);
      const prompt = rawFront.startsWith('¿')
        ? rawFront
        : `¿Qué significa “${rawFront}” según el material?`;

      return {
        id: `flashcard:${index}:${normalize(rawFront).slice(0, 48)}`,
        prompt,
        options,
        answer: correct,
        explanation: `Según el material: ${clean(card.back)}`,
        topic:
          rawFront.replace(/^¿Qué significa\s*/i, '').replace(/[“”"?]/g, '').trim() ||
          'Tema del resumen',
        reference: card.reference,
        sourceText: [
          rawFront,
          card.back,
          card.reference.sectionTitle,
          card.reference.excerpt,
        ]
          .filter(Boolean)
          .join(' '),
        level: card.level,
        kind: card.kind,
        origin: 'flashcard',
        directRecognition: true,
      } satisfies Candidate;
    })
    .filter((candidate): candidate is Candidate => Boolean(candidate));
}

function buildSummaryFallbackCandidates(sections: StudySummarySection[]): Candidate[] {
  const sectionIdeas = sections.map((section) => ({
    title: clean(section.title),
    body: section.body,
    sentences: sentenceCandidates(section.body),
  }));

  return sectionIdeas.flatMap((section, sectionIndex) => {
    const otherSentences = sectionIdeas
      .filter((_, index) => index !== sectionIndex)
      .flatMap((item) => item.sentences)
      .map((sentence) => truncate(sentence));

    return section.sentences.slice(0, 2).flatMap((sentence, sentenceIndex) => {
      const answer = truncate(sentence);
      const options = rotateCorrectOption(answer, otherSentences, sectionIndex + sentenceIndex);
      if (options.length < 3 || hasNearDuplicateOptions(options)) return [];

      const prompt =
        sentenceIndex === 0
          ? `¿Cuál de estas ideas corresponde a “${section.title}”?`
          : 'Según lo que acabás de leer, ¿cuál de estas afirmaciones es correcta?';

      return [
        {
          id: `summary:${sectionIndex}:${sentenceIndex}`,
          prompt,
          options,
          answer,
          explanation: `Esta idea aparece en el resumen del tema “${section.title}”.`,
          topic: section.title,
          reference: {
            pageStart: null,
            pageEnd: null,
            sectionTitle: section.title,
            excerpt: truncate(section.sentences.join(' '), 280),
          },
          sourceText: `${section.title} ${section.body}`,
          level: 'comprender',
          kind: 'section',
          origin: 'summary',
          directRecognition: true,
        } satisfies Candidate,
      ];
    });
  });
}

function pedagogicalQualityScore(candidate: Candidate) {
  let score = 0;

  if (candidate.level === 'aplicar') score += 32;
  if (candidate.level === 'comprender') score += 20;
  if (candidate.level === 'recordar') score -= 18;

  if (candidate.kind === 'confusion') score += 22;
  if (candidate.kind === 'relationship') score += 20;
  if (candidate.kind === 'process') score += 20;
  if (candidate.kind === 'formula') score += 18;
  if (candidate.kind === 'classification') score += 14;
  if (candidate.kind === 'section') score += 6;
  if (candidate.kind === 'concept') score -= 4;

  if (candidate.origin === 'artifact') score += 10;
  if (candidate.origin === 'summary') score -= 12;
  if (candidate.origin === 'flashcard') score -= 24;

  if (candidate.directRecognition) score -= 18;

  return score;
}

function scoreCandidate(candidate: Candidate, section: StudySummarySection) {
  const sectionText = `${section.title} ${section.body}`;
  const sectionWords = words(sectionText);
  const candidateWords = words(candidate.sourceText);
  const shared = sharedWordCount(sectionWords, candidateWords);

  const title = normalize(section.title);
  const source = normalize(candidate.sourceText);
  const titleWords = Array.from(words(section.title));
  const titleShared = titleWords.filter((word) => candidateWords.has(word)).length;

  let score = shared * 3 + titleShared * 5 + pedagogicalQualityScore(candidate);

  if (title.length >= 6 && source.includes(title)) score += 12;
  if (
    candidate.reference.sectionTitle &&
    normalize(candidate.reference.sectionTitle) === normalize(section.title)
  ) {
    score += 15;
  }

  if (candidate.id.startsWith(`summary:${sectionIndexOf(candidate.id)}:`)) {
    score += 4;
  }

  return score;
}

function sectionIndexOf(id: string) {
  const match = id.match(/^summary:(\d+):/);
  return match ? Number(match[1]) : -1;
}

function rankForSection(
  candidates: Candidate[],
  section: StudySummarySection,
  sectionIndex: number
) {
  return candidates
    .map((candidate, candidateIndex) => {
      let score = scoreCandidate(candidate, section);

      if (candidate.id.startsWith(`summary:${sectionIndex}:`)) score += 8;
      if (
        candidate.id.startsWith('summary:') &&
        !candidate.id.startsWith(`summary:${sectionIndex}:`)
      ) {
        score -= 25;
      }

      return { candidate, candidateIndex, score };
    })
    .filter(({ score }) => score > 4)
    .sort((left, right) => right.score - left.score || left.candidateIndex - right.candidateIndex)
    .map(({ candidate }) => candidate);
}

function questionIdentity(candidate: Candidate) {
  return `${normalize(candidate.prompt)}|${normalize(candidate.answer)}`;
}

function isDistinctQuestion(candidate: Candidate, selected: Candidate[]) {
  const identity = questionIdentity(candidate);
  return selected.every(
    (other) =>
      questionIdentity(other) !== identity &&
      normalize(other.answer) !== normalize(candidate.answer) &&
      normalize(other.prompt) !== normalize(candidate.prompt)
  );
}

function preferHigherOrder(candidates: Candidate[], excludedIds: Set<string>, selected: Candidate[]) {
  const available = candidates.filter(
    (candidate) => !excludedIds.has(candidate.id) && isDistinctQuestion(candidate, selected)
  );

  return (
    available.find(
      (candidate) =>
        candidate.origin === 'artifact' &&
        candidate.level !== 'recordar' &&
        !candidate.directRecognition
    ) ??
    available.find(
      (candidate) => candidate.origin === 'artifact' && candidate.level !== 'recordar'
    ) ??
    available.find((candidate) => candidate.level !== 'recordar') ??
    available[0] ??
    null
  );
}

export function buildSummaryCheckPlan(
  sections: StudySummarySection[],
  artifacts: PedagogicalArtifacts
): Array<SummaryCheckPlanItem | null> {
  if (sections.length === 0) return [];

  const candidates: Candidate[] = [
    ...artifacts.questions
      .map(fromStudyQuestion)
      .filter((candidate): candidate is Candidate => Boolean(candidate)),
    ...buildSummaryFallbackCandidates(sections),
    ...buildFlashcardCandidates(artifacts),
  ];

  const ranked = sections.map((section, index) => rankForSection(candidates, section, index));
  const plans: Array<SummaryCheckPlanItem | null> = [];

  for (let index = 0; index < sections.length; index += 1) {
    const section = sections[index];
    const current = ranked[index] ?? [];
    if (!section) {
      plans.push(null);
      continue;
    }

    if (index === 0) {
      const selected: Candidate[] = [];
      const first = preferHigherOrder(current, new Set(), selected);
      if (first) selected.push(first);

      const second = preferHigherOrder(
        current,
        new Set(first ? [first.id] : []),
        selected
      );
      if (second) selected.push(second);

      if (selected.length < 2) {
        plans.push(null);
        continue;
      }

      plans.push({
        chapterIndex: index,
        chapterTitle: section.title,
        questions: [selected[0], selected[1]],
      });
      continue;
    }

    const currentQuestion = preferHigherOrder(current, new Set(), []);
    if (!currentQuestion) {
      plans.push(null);
      continue;
    }

    const previousRanked = ranked[index - 1] ?? [];
    const recentlyUsedIds = new Set(
      (plans[index - 1]?.questions ?? []).map((question) => question.id)
    );
    recentlyUsedIds.add(currentQuestion.id);

    const previousQuestion =
      preferHigherOrder(previousRanked, recentlyUsedIds, [currentQuestion]) ??
      preferHigherOrder(
        previousRanked,
        new Set([currentQuestion.id]),
        [currentQuestion]
      );

    if (!previousQuestion) {
      plans.push(null);
      continue;
    }

    plans.push({
      chapterIndex: index,
      chapterTitle: section.title,
      questions: [currentQuestion, previousQuestion],
    });
  }

  return plans;
}

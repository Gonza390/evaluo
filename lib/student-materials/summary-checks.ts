import type { PedagogicalArtifacts, PedagogicalReference, StudyQuestion } from '@/lib/student-materials/pedagogy';
import type { StudySummarySection } from '@/lib/student-materials/types';

const STOP_WORDS = new Set([
  'para','como','este','esta','estos','estas','desde','sobre','entre','segun','tema','material',
  'capitulo','concepto','conceptos','idea','ideas','parte','puede','pueden','tambien','donde','cuando',
  'porque','cada','solo','solo','una','uno','unos','unas','del','las','los','que','con','por','sus',
]);

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

type Candidate = SummaryCheckQuestion & { sourceText: string };

function fromStudyQuestion(question: StudyQuestion): Candidate | null {
  if (question.type !== 'multiple_choice' || question.options.length < 2) return null;

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
      if (options.length < 3) return null;

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
        topic: rawFront.replace(/^¿Qué significa\s*/i, '').replace(/[“”"?]/g, '').trim() || 'Tema del resumen',
        reference: card.reference,
        sourceText: [
          rawFront,
          card.back,
          card.reference.sectionTitle,
          card.reference.excerpt,
        ]
          .filter(Boolean)
          .join(' '),
      } satisfies Candidate;
    })
    .filter((candidate): candidate is Candidate => Boolean(candidate));
}

function buildSummaryFallbackCandidates(sections: StudySummarySection[]): Candidate[] {
  const sectionIdeas = sections.map((section) => ({
    title: clean(section.title),
    sentences: sentenceCandidates(section.body),
  }));

  return sectionIdeas.flatMap((section, sectionIndex) => {
    const otherSentences = sectionIdeas
      .filter((_, index) => index !== sectionIndex)
      .flatMap((item) => item.sentences)
      .map((sentence) => truncate(sentence));

    return section.sentences.slice(0, 2).map((sentence, sentenceIndex) => {
      const answer = truncate(sentence);
      const options = rotateCorrectOption(answer, otherSentences, sectionIndex + sentenceIndex);
      return {
        id: `summary:${sectionIndex}:${sentenceIndex}`,
        prompt:
          sentenceIndex === 0
            ? `¿Cuál de estas ideas corresponde a “${section.title}”?`
            : `Según lo que acabás de leer, ¿cuál de estas afirmaciones es correcta?`,
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
      } satisfies Candidate;
    });
  });
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

  let score = shared * 3 + titleShared * 5;
  if (title.length >= 6 && source.includes(title)) score += 12;
  if (
    candidate.reference.sectionTitle &&
    normalize(candidate.reference.sectionTitle) === normalize(section.title)
  ) {
    score += 15;
  }
  if (candidate.id.startsWith('summary:')) {
    const sectionPrefix = `summary:${sectionIndexOf(candidate.id)}:`;
    if (candidate.id.startsWith(sectionPrefix)) score += 25;
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
      if (candidate.id.startsWith(`summary:${sectionIndex}:`)) score += 40;
      if (
        candidate.id.startsWith('summary:') &&
        !candidate.id.startsWith(`summary:${sectionIndex}:`)
      ) {
        score -= 20;
      }
      return { candidate, candidateIndex, score };
    })
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score || left.candidateIndex - right.candidateIndex)
    .map(({ candidate }) => candidate);
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
    ...buildFlashcardCandidates(artifacts),
    ...buildSummaryFallbackCandidates(sections),
  ];

  const ranked = sections.map((section, index) => rankForSection(candidates, section, index));

  return sections.map((section, index) => {
    const current = ranked[index] ?? [];

    if (index === 0) {
      const first = current[0];
      const second = current.find((candidate) => candidate.id !== first?.id);
      if (!first || !second) return null;
      return {
        chapterIndex: index,
        chapterTitle: section.title,
        questions: [first, second],
      };
    }

    const currentQuestion = current[0];
    const previousRanked = ranked[index - 1] ?? [];
    const previousQuestion =
      previousRanked.find(
        (candidate) =>
          candidate.id !== currentQuestion?.id &&
          candidate.id !== ranked[index - 1]?.[0]?.id
      ) ??
      previousRanked.find((candidate) => candidate.id !== currentQuestion?.id);

    if (!currentQuestion || !previousQuestion) return null;

    return {
      chapterIndex: index,
      chapterTitle: section.title,
      questions: [currentQuestion, previousQuestion],
    };
  });
}

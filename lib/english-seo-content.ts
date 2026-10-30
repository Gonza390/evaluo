export type EnglishPageKey = 'home' | 'pdf-to-quiz' | 'pdf-to-flashcards' | 'study-pdf-with-ai';

export type EnglishPage = {
  path: string;
  title: string;
  description: string;
  eyebrow: string;
  headline: string;
  intro: string;
  audience: string;
  outcome: string;
  exampleTitle: string;
  exampleSource: string;
  exampleQuestion: string;
  exampleAnswer: string;
  exampleExplanation: string;
  verification: string;
  steps: Array<{ title: string; detail: string }>;
  mistakes: Array<{ title: string; detail: string }>;
  faq: Array<{ question: string; answer: string }>;
};

export const ENGLISH_PAGES: Record<EnglishPageKey, EnglishPage> = {
  home: {
    path: '/en',
    title: 'Study PDFs with AI: Quizzes, Flashcards and Active Recall',
    description: 'Explore practical ways to study a PDF: turn notes into quizzes, create effective flashcards, check answers and revisit weak topics. Free examples from Evaluo.',
    eyebrow: 'English study resources from Evaluo',
    headline: 'Go beyond reading your PDF. Practice what you actually know.',
    intro: 'A summary makes a document shorter. A good study session goes further: you retrieve information without looking, explain your reasoning, correct mistakes and return to the relevant paragraph. Use these free examples to build a more effective routine from your own notes.',
    audience: 'University students preparing for exams with lecture slides, chapters and course notes.',
    outcome: 'A repeatable workflow: read a section, ask yourself a question, check the source, and revisit the part you missed.',
    exampleTitle: 'Worked example: learning diffusion and osmosis',
    exampleSource: 'Diffusion is the net movement of particles from higher concentration to lower concentration. Osmosis describes the movement of water across a selectively permeable membrane. Both depend on concentration differences, but they do not describe exactly the same process.',
    exampleQuestion: 'A student says, “Osmosis is just another word for diffusion.” What is missing from that explanation?',
    exampleAnswer: 'Osmosis is specifically the net movement of water across a selectively permeable membrane.',
    exampleExplanation: 'The broader idea of moving down a concentration gradient is related, but a precise answer identifies the substance and membrane.',
    verification: 'Underline the words “water” and “selectively permeable membrane” in the original paragraph. If your PDF uses a different definition, follow the terminology in your course.',
    steps: [
      { title: 'Choose one section, not a whole textbook', detail: 'Use the headings in your PDF to isolate a small objective, such as distinguishing osmosis from diffusion. Write down what you should be able to explain afterward.' },
      { title: 'Close the PDF and answer a question', detail: 'Ask yourself to explain a process, compare two ideas or apply a concept to a new situation. Do not copy the answer from the paragraph.' },
      { title: 'Compare your answer with the source', detail: 'Identify missing conditions, swapped definitions and unsupported claims. Check figures, tables and formulas manually.' },
      { title: 'Return to the weak topic later', detail: 'Practice again after a delay with a different question. Use the mistakes to plan the next short study session.' },
    ],
    mistakes: [
      { title: 'Stopping at a summary', detail: 'A polished summary can feel familiar even when you cannot recall the content. Add questions that require you to produce an answer.' },
      { title: 'Treating AI output as the original source', detail: 'AI-generated examples can be incomplete or inaccurate. Compare every disputed fact with your lecture notes or the assigned reading.' },
    ],
    faq: [
      { question: 'Can I prepare a quiz from my own course PDF?', answer: 'Yes. A useful method is to identify the learning goals, write questions that require recall or application, and check the answers against the PDF. Read the quiz guide for an example.' },
      { question: 'Should I choose flashcards or quizzes?', answer: 'Use flashcards to retrieve concise terms and relationships. Use quizzes to test explanations, scenarios and reasoning. Both can be part of one study session.' },
      { question: 'Does Evaluo already offer a full English-language app?', answer: 'Not yet. These educational pages are in English, but the current product interface and account flow are primarily in Spanish. An English product experience is planned.' },
    ],
  },
  'pdf-to-quiz': {
    path: '/en/pdf-to-quiz',
    title: 'PDF to Quiz: Make Better Practice Questions from Notes',
    description: 'Learn how to turn a PDF into useful quiz questions with a worked biology example, answer explanations, question-writing checklist and honest AI limitations.',
    eyebrow: 'PDF to quiz • Study method',
    headline: 'Turn a PDF into a quiz that tests understanding, not just recognition.',
    intro: 'Copying a sentence and removing one word is easy. Creating a useful question takes more care: define what the learner should understand, ask for an explanation or decision, and check the answer using the original PDF. Here is a practical method you can use before an exam.',
    audience: 'Students who want practice questions from lecture notes, academic PDFs or study guides.',
    outcome: 'A small, verifiable question set covering definitions, explanations and applications rather than repeated paraphrases.',
    exampleTitle: 'Worked quiz example: photosynthesis and limiting factors',
    exampleSource: 'At low light intensity, increasing light can increase the rate of photosynthesis. At higher intensity the rate can level off when another factor, such as carbon dioxide availability or temperature, becomes limiting. Increasing light alone will not always increase the rate.',
    exampleQuestion: 'A plant receives more light, but its photosynthesis rate no longer rises. Which explanation best fits the paragraph?',
    exampleAnswer: 'A different factor, such as carbon dioxide availability or temperature, may now be limiting the rate.',
    exampleExplanation: 'A good application question asks the student to interpret a change in conditions, not merely repeat “light is needed for photosynthesis.”',
    verification: 'Check the sentence about the rate leveling off in the original source. A graph may specify an additional condition; if so, include that condition in the question.',
    steps: [
      { title: 'Identify testable learning goals', detail: 'For each heading, write one action: define, compare, explain, calculate or apply. A chapter on photosynthesis can test a definition and also a limiting-factor scenario.' },
      { title: 'Write several question types', detail: 'Include one short recall question, one multiple-choice question with plausible distractors, and one application question. Avoid six rewordings of the same fact.' },
      { title: 'Explain why the answer is right', detail: 'A useful explanation connects the answer back to the mechanism in the PDF and, for multiple choice, explains why a tempting wrong option is not supported.' },
      { title: 'Audit the quiz before using it', detail: 'Check units, dates, formulas, tables and exact terminology. Remove questions that cannot be answered from the material and mark uncertain claims for review.' },
      { title: 'Review mistakes by topic', detail: 'Group missed questions by concept instead of treating the score as the end. Return to the passage, correct your explanation, and retry with a new scenario.' },
    ],
    mistakes: [
      { title: 'Using the PDF as a keyword list', detail: 'A quiz made only of definitions misses understanding and real application. Ask “what would happen if…” or “why does…” when the source allows it.' },
      { title: 'Accepting confident but unsupported answers', detail: 'AI-generated answers can misread scanned text or omit a condition from a graph. Check each answer in the original PDF before relying on it.' },
      { title: 'Calling practice questions official exam papers', detail: 'Questions you or an AI generate are study exercises, not leaked or institution-approved exam content.' },
    ],
    faq: [
      { question: 'How many questions should I create per PDF?', answer: 'Choose a quantity based on the number of learning objectives. A short section may need a few carefully checked questions; a long chapter may need a separate set for each topic.' },
      { question: 'Can a PDF quiz include multiple-choice questions?', answer: 'Yes. Include plausible but clearly incorrect alternatives and a short explanation grounded in the document. Avoid distractors that are ambiguous or technically true.' },
      { question: 'Can I turn scanned PDF pages into questions?', answer: 'Only if the text and diagrams are interpreted correctly. OCR and AI can miss labels and symbols; inspect the extracted content and verify important answers manually.' },
    ],
  },
  'pdf-to-flashcards': {
    path: '/en/pdf-to-flashcards',
    title: 'PDF to Flashcards: Make Study Cards from Your Notes',
    description: 'Create stronger flashcards from PDFs with a worked economics example, one-idea-per-card rules, active recall and spaced-review advice.',
    eyebrow: 'PDF to flashcards • Active recall',
    headline: 'Make flashcards from a PDF that are worth reviewing.',
    intro: 'A flashcard is more than a sentence cut into two halves. Good cards prompt a specific retrieval, show a precise answer and help you notice a mistaken idea. Start with one concept per card and use the original document to verify the back.',
    audience: 'Students who want to memorize and understand definitions, contrasts, formulas and key relationships from a PDF.',
    outcome: 'Short, unambiguous question-and-answer cards that are easy to test and correct.',
    exampleTitle: 'Worked flashcard example: price elasticity of demand',
    exampleSource: 'Price elasticity of demand measures how responsive quantity demanded is to a change in price, commonly expressed as the percentage change in quantity demanded divided by the percentage change in price. Other conditions are assumed constant for interpretation.',
    exampleQuestion: 'Front: What does price elasticity of demand compare?',
    exampleAnswer: 'Back: The percentage change in quantity demanded relative to the percentage change in price.',
    exampleExplanation: 'A separate card can ask for the formula and a third can test interpretation. Avoid combining definition, formula, assumptions and an example in one oversized card.',
    verification: 'Check whether your course uses absolute values or a negative sign when interpreting elasticity, and preserve its convention.',
    steps: [
      { title: 'Split the PDF by learning objective', detail: 'Choose a small section. Highlight only testable terms and relationships rather than copying every highlighted paragraph.' },
      { title: 'Write a specific prompt for each card', detail: 'Ask “What does X measure?” instead of “Explain everything about X.” Use a second card for a formula or a comparison.' },
      { title: 'Keep the back concise but complete', detail: 'Include the shortest accurate answer and a necessary condition. Add a brief note about a common confusion only when it helps prevent an error.' },
      { title: 'Test before revealing the answer', detail: 'Say or write your answer first. A familiar-looking back is not evidence that you could retrieve the idea independently.' },
      { title: 'Review difficult cards again', detail: 'Revisit missed cards at a later session and alternate them with practice questions that require application. Change cards that remain ambiguous.' },
    ],
    mistakes: [
      { title: 'Putting an entire paragraph on one card', detail: 'Long cards make it hard to identify exactly what you forgot. Break them into small, meaningful retrieval prompts.' },
      { title: 'Memorizing a formula without conditions', detail: 'Include what the variables mean, the units or conventions when relevant. Test calculations separately.' },
      { title: 'Only rereading the backs', detail: 'Reading is not retrieval practice. Cover the answer, attempt it, then reveal and check.' },
    ],
    faq: [
      { question: 'Can I make flashcards from a PDF with AI?', answer: 'AI can draft prompts and concise answers from extracted notes, but the useful part is checking each card against your source and testing recall before flipping it.' },
      { question: 'Should I make one card for every sentence?', answer: 'No. Prioritize learning objectives and important relationships. Some sentences are context and should not become separate cards.' },
      { question: 'What if a flashcard is always difficult?', answer: 'Check whether it asks multiple things, lacks context or contains an uncertain answer. Rewrite it or review the underlying concept before practicing again.' },
    ],
  },
  'study-pdf-with-ai': {
    path: '/en/study-pdf-with-ai',
    title: 'How to Study a PDF with AI: A Practical Study Workflow',
    description: 'A practical guide to studying PDFs with AI: organize topics, summarize carefully, generate quiz questions, check errors and review weaker concepts.',
    eyebrow: 'Study PDF with AI • Step-by-step',
    headline: 'Study a PDF with AI without losing the original meaning.',
    intro: 'AI can help organize a long reading, but it should not become the only source you trust. A reliable study process keeps the original PDF available while you summarize, ask questions, explain answers and plan another review.',
    audience: 'University students working with long readings, lecture slides, PDFs and exam materials.',
    outcome: 'A focused, source-checked study routine that converts reading into evidence of what you understand.',
    exampleTitle: 'Worked example: working memory versus long-term memory',
    exampleSource: 'Working memory temporarily maintains and manipulates information for ongoing tasks. Long-term memory supports the retention and later retrieval of information. The two systems interact, but serving a current calculation is not the same as retaining a concept for months.',
    exampleQuestion: 'Why does mentally rearranging several numbers rely on working memory?',
    exampleAnswer: 'Because the task requires holding and manipulating information while the calculation is happening.',
    exampleExplanation: 'A useful study question tests the role of a concept in a task. A separate question can compare it with long-term retention.',
    verification: 'Check the assigned text for your course’s model of memory; different authors may use different frameworks and definitions.',
    steps: [
      { title: 'Check the document first', detail: 'Look at page order, readable text, tables and illustrations. Scans, footnotes and multi-column layouts may need extra review.' },
      { title: 'Extract a topic map', detail: 'List headings and learning objectives. Decide what you should be able to explain in your own words after each section.' },
      { title: 'Write a summary with references', detail: 'Condense only the main relationships. Cross-check names, numerical claims and definitions with the source PDF before memorizing them.' },
      { title: 'Practice without looking', detail: 'Write a definition, compare two terms or answer a scenario question. For precise facts, return to the page that supports the answer.' },
      { title: 'Use mistakes to select the next topic', detail: 'Record what the answer was missing and why. Review that source section and test it later with a new example.' },
    ],
    mistakes: [
      { title: 'Trusting a summary without reading the source', detail: 'AI may simplify away important caveats, misread tables or omit exceptions. Use it to guide study, not to replace the required reading.' },
      { title: 'Practicing questions unrelated to the syllabus', detail: 'Use course objectives as the checklist. If a generated question cannot be justified by the PDF, revise or discard it.' },
    ],
    faq: [
      { question: 'Can AI summarize a long academic PDF?', answer: 'It can help organize readable material, but the result should be checked against the original, especially for citations, diagrams, formulas and scientific claims.' },
      { question: 'Is summarizing enough to prepare for an exam?', answer: 'Usually not. Add retrieval practice, explanations and feedback so that you can test what you can produce without looking at the notes.' },
      { question: 'Does this guide replace my university’s material?', answer: 'No. The assigned readings, lecturer guidance and syllabus remain your primary sources. These steps are a study method, not an official course resource.' },
    ],
  },
};

export const ENGLISH_PAGE_ORDER: EnglishPageKey[] = ['home', 'pdf-to-quiz', 'pdf-to-flashcards', 'study-pdf-with-ai'];

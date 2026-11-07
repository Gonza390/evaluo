export type EnglishPageKey =
  | 'home'
  | 'pdf-to-quiz'
  | 'pdf-to-flashcards'
  | 'study-pdf-with-ai'
  | 'ai-test-prep'
  | 'ai-for-students'
  | 'ai-pdf-summarizer'
  | 'pdf-to-mind-map'
  | 'practice-by-topic';

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
  /** Fecha de la última revisión editorial (ISO). Se muestra y alimenta el JSON-LD Article. */
  reviewed?: string;
  /** Qué hace Evaluo en este caso de uso, con los límites reales de cada plan. */
  product?: {
    title: string;
    intro: string;
    points: Array<{ title: string; detail: string }>;
    plan: string;
  };
};

export const ENGLISH_PAGES: Record<EnglishPageKey, EnglishPage> = {
  home: {
    path: '/en/resources',
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
      { question: 'Can I use Evaluo in English?', answer: 'Yes. The Evaluo study platform is available in English: create an account from the English sign-up page, upload your PDF or Word notes and study them by topic. The worked examples in these guides are available without an account.' },
    ],
  },
  'pdf-to-quiz': {
    path: '/en/pdf-to-quiz',
    title: 'PDF to Quiz with AI, Free: Practice Questions from Your Notes',
    description: 'Turn a PDF into a quiz with AI, free. Choose your file without signing up, answer questions from your own notes and see explanations for what you got wrong.',
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
    title: 'Free AI Flashcard Generator from PDF: Study Cards in Minutes',
    description: 'Free AI flashcard generator: turn your PDF or Word notes into question-and-answer cards by topic. Choose your file without signing up and start reviewing.',
    eyebrow: 'AI flashcard generator • PDF to flashcards',
    headline: 'Generate flashcards from a PDF with AI, and make them worth reviewing.',
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
  'ai-test-prep': {
    path: '/en/ai-test-prep',
    title: 'AI Test Prep Platform, Free: Mock Exams from Your Notes',
    description: 'Free AI test prep from your own notes: build a mock exam from your PDF, practice by topic and see what to review. Choose your file without signing up.',
    eyebrow: 'AI test prep • Mock exams from your notes',
    headline: 'AI test prep that starts from your own notes, not a generic question bank.',
    intro: 'A useful practice test should look like your course, not like a random quiz. Start from the PDF your exam is based on, practice topic by topic, take a timed mock exam, and use the results to choose what to study next. Evaluo turns your notes into that loop; this guide shows the method so you can use it with or without an account.',
    audience: 'High school, university and professional students preparing midterms, finals, admission tests or certification exams from their own course material.',
    outcome: 'A mock exam that covers the syllabus, a score broken down by topic, and a short list of concepts to review before the next attempt.',
    exampleTitle: 'Worked mock-exam example: supply and demand',
    exampleSource: 'When the price of a good rises and other conditions stay the same, the quantity demanded usually falls. A change in income or in the price of a related good shifts the whole demand curve instead of moving along it.',
    exampleQuestion: 'Consumers’ incomes rise and they buy more of a normal good at every price. Is this a movement along the demand curve or a shift of the curve?',
    exampleAnswer: 'A shift of the demand curve to the right: income changed, not the good’s own price.',
    exampleExplanation: 'A strong practice question makes you separate two ideas students often mix up (a movement versus a shift) instead of asking you to repeat a definition. If you miss it, review the topic, not just the question.',
    verification: 'Check how your course defines normal and inferior goods and which graph conventions it uses. Follow your syllabus when it differs from this simplified example.',
    steps: [
      { title: 'Map the exam to topics', detail: 'List the units your exam covers and how much each one weighs. A mock exam that over-samples the first chapter gives a misleading score.' },
      { title: 'Practice topic by topic first', detail: 'Answer short sets per topic before a full mock exam. Topic-level practice shows where you are weak while there is still time to fix it.' },
      { title: 'Take a timed mock exam', detail: 'Mix topics, use the real time limit and do not check notes. The goal is to rehearse retrieval under exam conditions, not to get a perfect score.' },
      { title: 'Read the results by topic', detail: 'A 70% overall score can hide a topic where you got almost everything wrong. Sort mistakes by concept and by cause: misunderstanding, confusion between terms or careless error.' },
      { title: 'Plan the next study session', detail: 'Review the weakest topic in your notes, then retry with new questions a day or two later. Repeat the mock exam closer to the exam date.' },
    ],
    mistakes: [
      { title: 'Repeating the same practice test', detail: 'Retaking identical questions measures memory of the answers, not understanding. Use new questions on the same topics.' },
      { title: 'Treating AI questions as the real exam', detail: 'AI-generated practice questions are study exercises. They are not official, leaked or institution-approved exam content, and they can contain mistakes you should check against your notes.' },
      { title: 'Only looking at the final score', detail: 'The score tells you how you did; the breakdown by topic tells you what to do next.' },
    ],
    faq: [
      { question: 'Can AI create a practice test from my PDF?', answer: 'Yes. AI can draft multiple-choice, true/false and short-answer questions from readable PDF or Word notes. Check answers that depend on formulas, tables or scanned pages against the original document.' },
      { question: 'How is a mock exam different from a quiz?', answer: 'A quiz checks one topic. A mock exam mixes the whole syllabus under exam conditions, such as a time limit and no notes, so you can see how you perform when topics are combined.' },
      { question: 'Is Evaluo free for test prep?', answer: 'You can start free, which includes a mock exam and practice questions from one document. Premium adds more uploads, more practice and additional mock exam modes. See the pricing page for the current details.' },
      { question: 'Will an AI practice test predict my grade?', answer: 'No. A practice score is a signal about what to review, not a prediction of your final grade. Exams vary by instructor, format and marking criteria.' },
    ],
    reviewed: '2026-11-06',
    product: {
      title: 'How Evaluo prepares you for a test',
      intro: 'Evaluo builds the practice and the mock exam from the document your exam is based on, and keeps the results by topic.',
      points: [
        { title: 'Practice before the mock exam', detail: 'Short sets of multiple-choice, true/false and matching questions for each topic of your PDF or Word notes.' },
        { title: 'A mock exam from your material', detail: 'A mixed exam across the topics of your document, with explanations to review afterwards.' },
        { title: 'A plan until exam day', detail: 'Results by topic feed a study plan that spreads your review until the exam date.' },
      ],
      plan: 'The Free plan includes 1 mock exam and 1 study plan for one document. Premium adds extra mock exam modes, more detailed explanations and up to 3 new uploads per day.',
    },
  },
  'ai-for-students': {
    path: '/en/ai-for-students',
    title: 'Study with AI, Free: An AI Study Assistant for Students',
    description: 'Study with AI without letting it think for you: upload your PDF notes free and get topic summaries, flashcards and practice questions. No sign-up to pick a file.',
    eyebrow: 'AI for students • Study with AI',
    headline: 'How to study with AI so you learn more, not less.',
    intro: 'AI can explain a concept five different ways, quiz you at midnight and turn a long PDF into a study plan. It can also hand you a confident wrong answer or do the thinking you were supposed to practice. This guide shows how to use an AI study assistant to strengthen your own recall and reasoning, and where to draw the line.',
    audience: 'High school, college and professional students who want to use AI for exam preparation while respecting their institution’s rules.',
    outcome: 'A clear routine for using AI as a tutor and quiz partner, a checklist for spotting unreliable answers, and a rule of thumb for what not to delegate.',
    exampleTitle: 'Worked example: checking an AI explanation of conditioning',
    exampleSource: 'Classical conditioning pairs a neutral stimulus with a stimulus that already triggers an automatic response, until the neutral stimulus alone triggers it. Operant conditioning changes how often a voluntary behavior occurs through its consequences, such as reinforcement or punishment.',
    exampleQuestion: 'An AI says: “A student who studies more after being praised for a good grade is an example of classical conditioning.” Is the AI right?',
    exampleAnswer: 'No. Studying is a voluntary behavior that increased after a consequence (praise), so it is operant conditioning, specifically positive reinforcement.',
    exampleExplanation: 'This is the kind of error AI tools make: the answer sounds fluent and uses the right vocabulary, but it mixes up two related ideas. Comparing the claim with the definition in your notes catches it in seconds.',
    verification: 'Find the definitions of classical and operant conditioning in your own course material. If your instructor uses different terms (for example, “instrumental conditioning”), use theirs.',
    steps: [
      { title: 'Start from your course material', detail: 'Give the AI your syllabus, lecture notes or assigned reading instead of asking open questions. Answers grounded in your material are easier to check and closer to what your exam will ask.' },
      { title: 'Ask it to quiz you, not to answer for you', detail: 'Retrieval practice, trying to answer from memory, is one of the best-supported study techniques. Ask for questions, answer them yourself, then ask for feedback.' },
      { title: 'Make it explain your mistakes', detail: 'When you get something wrong, ask why the right answer is right and why your answer is tempting but wrong. Then go back to the paragraph in your notes.' },
      { title: 'Verify anything you will rely on', detail: 'Check formulas, dates, statistics, quotes and references against the original source. AI can invent citations and mix up similar concepts.' },
      { title: 'Plan, then repeat', detail: 'Use your results to decide which topic to review next, and come back to it a few days later with new questions. Spacing your reviews works better than cramming.' },
    ],
    mistakes: [
      { title: 'Submitting AI-generated work as your own', detail: 'Many schools and universities treat this as academic misconduct. Check your institution’s and your instructor’s AI policy before using AI for any graded work.' },
      { title: 'Confusing fluency with understanding', detail: 'Reading a clear AI explanation feels like learning. Test yourself without looking before deciding you know a topic.' },
      { title: 'Studying from AI instead of the syllabus', detail: 'AI does not know what your instructor emphasized. Use your syllabus and past feedback to decide what to practice.' },
    ],
    faq: [
      { question: 'Is it cheating to use AI to study?', answer: 'Using AI to explain concepts, quiz yourself or plan your study time is generally treated as studying, not cheating. Submitting AI-written answers for graded work may break your institution’s rules. Policies vary, so check yours.' },
      { question: 'What is the best way for students to use AI?', answer: 'As a tutor and quiz partner: ask it to test you on your own notes, explain your mistakes and help you plan reviews. Keep the thinking, writing and final answers your own.' },
      { question: 'Can AI make mistakes when explaining a topic?', answer: 'Yes. AI can state wrong facts confidently, confuse related concepts and invent sources. Verify anything important against your course material.' },
      { question: 'What is an AI study assistant?', answer: 'A tool that uses AI to help you study: explaining concepts, summarizing material, generating practice questions and tracking what you need to review. Evaluo is one, built around your own PDF or Word notes.' },
    ],
    reviewed: '2026-11-06',
    product: {
      title: 'How Evaluo works as an AI study assistant',
      intro: 'Evaluo is built for the routine above: it starts from your own notes and keeps the focus on practice, not on writing answers for you.',
      points: [
        { title: 'Your notes become topics', detail: 'Upload a PDF or Word file and Evaluo organizes it into topics with a summary and a glossary, so every question stays tied to your material.' },
        { title: 'Practice in several formats', detail: 'Multiple-choice and true/false questions, flashcards, matching rounds, practical cases and a mock exam, all generated from the same document.' },
        { title: 'Progress by topic and a study plan', detail: 'Results are grouped by topic, so you know what to review, and a study plan spreads the work until your exam date.' },
      ],
      plan: 'The Free plan includes one lifetime upload with 12 multiple-choice and 10 true/false questions, 25 flashcards, 2 practical cases, 1 matching round, 1 mock exam and 1 study plan. Premium adds up to 3 new uploads per day, mind maps, more explanations and extra mock exam modes.',
    },
  },
  'ai-pdf-summarizer': {
    path: '/en/ai-pdf-summarizer',
    title: 'Free AI PDF Summarizer for Studying: Summaries by Topic',
    description: 'Summarize a PDF with AI for free: choose your file without signing up and get a summary and glossary by topic, plus flashcards and questions from the same notes.',
    eyebrow: 'AI PDF summarizer • Study notes',
    headline: 'Summarize a PDF with AI, and keep what your exam will actually test.',
    intro: 'A summary that is short but drops the conditions, exceptions and definitions your instructor cares about can be worse than no summary at all. A good study summary is organized by topic, keeps precise wording for key terms, and points back to the page it came from. Here is how to get that from an AI PDF summarizer, and how to check it.',
    audience: 'Students turning long readings, lecture slides or textbook chapters into study notes before an exam.',
    outcome: 'Topic-by-topic summaries that keep definitions and conditions intact, plus a quick way to test whether you actually learned them.',
    exampleTitle: 'Worked example: summarizing a paragraph on inflation',
    exampleSource: 'Inflation is a sustained increase in the general price level of goods and services in an economy over time. When inflation is higher than the growth of nominal wages, the purchasing power of those wages falls. A one-off rise in the price of a single product is not, by itself, inflation.',
    exampleQuestion: 'An AI summary says: “Inflation is when prices go up, so people can buy less.” What important ideas did it lose?',
    exampleAnswer: 'It lost “sustained” and “general price level” (a single price rising is not inflation) and the condition that purchasing power falls when inflation outpaces wage growth.',
    exampleExplanation: 'Over-short summaries often remove exactly the qualifiers exam questions are built on. Keep key definitions close to the original wording and summarize the explanation around them.',
    verification: 'Compare the summary line by line with the original paragraph and underline every qualifier (sustained, general, higher than). If one is missing from the summary, add it back.',
    steps: [
      { title: 'Summarize by section, not the whole PDF at once', detail: 'Use the headings of your document. Short, topic-level summaries are easier to check and easier to review later than one long overview.' },
      { title: 'Keep definitions close to the source', detail: 'Paraphrase explanations, but keep the precise wording of definitions, formulas and named theories. That is what exam questions test.' },
      { title: 'Check against the original', detail: 'Look for dropped conditions, merged concepts, wrong numbers and claims that are not in your PDF. Scanned pages, tables and figures need extra care.' },
      { title: 'Turn the summary into questions', detail: 'For each topic, write or generate two or three questions and answer them without looking. A summary you cannot recall from is not finished.' },
      { title: 'Review the weak topics again', detail: 'Mark the topics where you missed questions and re-read only those sections in the original before the next practice round.' },
    ],
    mistakes: [
      { title: 'Studying only from the summary', detail: 'A summary is a map of the material, not a replacement for it. Go back to the original for anything you get wrong.' },
      { title: 'Trusting summaries of scanned or complex PDFs', detail: 'Text extraction can miss columns, footnotes, symbols and table values. Check those parts manually.' },
      { title: 'Re-reading instead of testing', detail: 'Re-reading a summary feels productive but builds familiarity, not recall. Test yourself first, then re-read what you missed.' },
    ],
    faq: [
      { question: 'Can AI summarize a PDF accurately?', answer: 'For readable text it is usually a good starting point, but it can drop qualifiers, merge similar ideas or misread tables and scanned pages. Check key definitions and numbers against the original.' },
      { question: 'How long should a study summary be?', answer: 'Long enough to keep every definition, condition and relationship you could be asked about. For most course readings that means a short summary per section, not one paragraph for the whole document.' },
      { question: 'Is summarizing enough to prepare for an exam?', answer: 'No. Summaries help you organize the material; practice questions show whether you can recall and apply it. Combine both.' },
      { question: 'Can I summarize Word documents as well as PDFs?', answer: 'In Evaluo, yes: you can upload PDF or Word files. Other tools vary, so check which formats they accept.' },
    ],
    reviewed: '2026-11-06',
    product: {
      title: 'How Evaluo summarizes your PDF',
      intro: 'Evaluo summarizes your document topic by topic and keeps the summary connected to practice, so you can check what you learned right away.',
      points: [
        { title: 'Summary and glossary per topic', detail: 'Each topic of your PDF or Word file gets its own summary and the key terms in a glossary, instead of one long overview.' },
        { title: 'From summary to practice', detail: 'Continue from a topic summary to flashcards and practice questions about the same section.' },
        { title: 'Review what you missed', detail: 'Results are grouped by topic, so you know which summaries and sections to revisit.' },
      ],
      plan: 'Topic summaries and the glossary are included in the Free plan (one lifetime upload). Premium adds up to 3 new uploads per day, mind maps and more explanations.',
    },
  },
  'pdf-to-mind-map': {
    path: '/en/pdf-to-mind-map',
    title: 'AI Mind Map from PDF: Turn Your Notes into a Study Map',
    description: 'Create a mind map from a PDF with AI: how to structure branches, a worked history example on the causes of WWI, and how to check the links between ideas.',
    eyebrow: 'AI mind map • PDF to mind map',
    headline: 'Turn a PDF into a mind map that shows how the ideas connect.',
    intro: 'Most study material is written in a line, but most exam questions ask how ideas relate: causes and effects, categories and examples, theories and their critics. A mind map puts those relationships on one page. AI can draft the structure from your PDF in seconds; your job is to check that every branch and link is actually supported by the source.',
    audience: 'Students in history, biology, law, business and other subjects where understanding relationships matters as much as definitions.',
    outcome: 'A one-page map of a topic with a clear central idea, correctly ranked branches, and links you can explain out loud.',
    exampleTitle: 'Worked example: mapping the causes of the First World War',
    exampleSource: 'Historians often group the long-term causes of the First World War as militarism, alliances, imperialism and nationalism. The assassination of Archduke Franz Ferdinand in Sarajevo in June 1914 was the immediate trigger: it set off a chain of declarations of war through the alliance system.',
    exampleQuestion: 'An AI mind map places “assassination of Franz Ferdinand” as a fifth branch next to militarism, alliances, imperialism and nationalism. What is wrong with that structure?',
    exampleAnswer: 'The assassination is the immediate trigger, not a fifth long-term cause. It belongs on its own level, linked to the alliances branch that turned a regional crisis into a wider war.',
    exampleExplanation: 'Mind maps go wrong less often in the labels than in the hierarchy. Putting a trigger on the same level as structural causes teaches the wrong relationship, which is exactly what essay questions probe.',
    verification: 'Check how your course and textbook frame the causes of the war. Historians weigh these factors differently, so follow the framework your instructor uses.',
    steps: [
      { title: 'Pick one topic as the center', detail: 'A mind map of an entire PDF becomes a wall of text. Use one chapter or heading as the central node.' },
      { title: 'Rank the branches', detail: 'Decide what is a main idea, what is a sub-idea and what is an example. Most errors come from putting things on the wrong level.' },
      { title: 'Label the links', detail: 'Write the relationship on the connection, such as “causes”, “is a type of” or “contradicts”. Unlabeled lines hide misunderstandings.' },
      { title: 'Check each branch against the PDF', detail: 'Every node should be traceable to a passage in your material. Remove branches the AI added from general knowledge if your course does not cover them.' },
      { title: 'Explain the map without looking', detail: 'Cover the map and explain the topic from the center outward. Where you get stuck is what to review next.' },
    ],
    mistakes: [
      { title: 'Mapping everything', detail: 'Too many nodes make the map as hard to review as the original. Keep the branches your exam can ask about.' },
      { title: 'Flat structures', detail: 'If every node hangs from the center, you have a list, not a map. Group related ideas under shared branches.' },
      { title: 'Only looking at the map', detail: 'A map helps you see structure; recalling and explaining it is what helps you remember. Test yourself on it.' },
    ],
    faq: [
      { question: 'Can AI create a mind map from a PDF?', answer: 'Yes. AI can extract the main topics and subtopics of a readable PDF and draft a map. Check the hierarchy and the links against the source before studying from it.' },
      { question: 'What is the difference between a mind map and a concept map?', answer: 'A mind map branches out from one central idea. A concept map connects many concepts with labeled links and can have several centers. Both help you study relationships.' },
      { question: 'Are mind maps good for studying?', answer: 'They help you organize and see relationships, especially in subjects with many connected ideas. They work best combined with practice questions that test recall.' },
      { question: 'Does Evaluo make mind maps for free?', answer: 'No. Mind maps are a Premium feature. On the Free plan you can still use topic summaries, the glossary, flashcards and practice questions.' },
    ],
    reviewed: '2026-11-06',
    product: {
      title: 'Mind maps in Evaluo',
      intro: 'In Evaluo the mind map is built from the same topics as your summaries and practice questions, so you can move between seeing the structure and testing it.',
      points: [
        { title: 'Generated from your document', detail: 'The map uses the topics and concepts of your own PDF or Word file, not a generic template.' },
        { title: 'Connected to practice', detail: 'From the map you can go back to a topic’s summary, flashcards or questions.' },
        { title: 'Glossary for precise terms', detail: 'Key terms are also listed in a glossary, which is available on every plan.' },
      ],
      plan: 'Mind maps are a Premium feature. Premium also includes up to 3 new uploads per day and extra mock exam modes. The Free plan includes summaries, the glossary, flashcards and practice questions for one document.',
    },
  },
  'practice-by-topic': {
    path: '/en/practice-by-topic',
    title: 'Practice Questions by Topic with AI, Free, from Your PDF',
    description: 'Practice by topic with AI, free: choose your PDF without signing up, answer questions chapter by chapter and find the topics you still need to review.',
    eyebrow: 'Topic-based practice • Practice questions',
    headline: 'Practice topic by topic, and stop studying everything with the same effort.',
    intro: 'If you study a whole course at the same intensity, you spend most of your time on what you already know. Practicing by topic shows where your gaps are: answer a short set of questions per topic, look at what you missed, review only that part of your notes, and move on when you can answer new questions correctly.',
    audience: 'Students with a broad syllabus and limited time before an exam, from high school finals to university midterms and professional certifications.',
    outcome: 'A topic-by-topic picture of what you know, a short list of weak spots to review, and a clear signal for when to move on.',
    exampleTitle: 'Worked example: mean versus median with an outlier',
    exampleSource: 'The mean is the sum of the values divided by how many there are. The median is the middle value when the data are ordered. An extreme value (an outlier) pulls the mean toward it but barely affects the median.',
    exampleQuestion: 'Five students reported weekly study hours: 2, 3, 3, 4 and 48. Which value better describes a typical student, and why?',
    exampleAnswer: 'The median, 3 hours. The mean is 12 hours (60 ÷ 5) because the outlier of 48 pulls it up, so it does not describe a typical student.',
    exampleExplanation: 'A topic-level question like this tests whether you can apply the definitions, not just recite them. If you chose the mean, the gap is understanding how outliers affect each measure, so review that, not the whole statistics chapter.',
    verification: 'Recalculate: 2 + 3 + 3 + 4 + 48 = 60 and 60 ÷ 5 = 12; the ordered middle value is 3. Check how your course defines outliers if the question asks you to identify one.',
    steps: [
      { title: 'Split the syllabus into topics', detail: 'Use the units or headings of your course material. Each topic should be small enough to practice in one short session.' },
      { title: 'Test before you review', detail: 'Answer a few questions on a topic before re-reading it. Your first attempt shows what you actually remember.' },
      { title: 'Read results by topic and cause', detail: 'For each mistake, note whether you did not know the concept, confused it with another one or made a careless error. Each needs a different fix.' },
      { title: 'Review only what you missed', detail: 'Go back to the section of your notes behind each mistake. Skip the topics where you answered new questions correctly.' },
      { title: 'Move on, then come back', detail: 'Continue to the next topic and retest weak ones a few days later with different questions. Mix topics as the exam gets closer.' },
    ],
    mistakes: [
      { title: 'Repeating the same questions', detail: 'Getting a question right the second time may mean you remember the answer, not the concept. Use new questions on the same topic.' },
      { title: 'Only practicing favorite topics', detail: 'It is tempting to practice what feels good. Start with the topics where your results are worst.' },
      { title: 'Never mixing topics', detail: 'Exams mix topics. After practicing each one, finish with mixed sets or a mock exam.' },
    ],
    faq: [
      { question: 'Is it better to study by topic or all at once?', answer: 'Start by topic to find and fix gaps efficiently, then mix topics closer to the exam, because real exams combine them.' },
      { question: 'How many practice questions per topic?', answer: 'Enough to cover the main ideas of the topic, often 5 to 10. If you miss several, review and retry with new questions rather than adding more of the same.' },
      { question: 'When should I move on to the next topic?', answer: 'When you can answer new questions on it correctly without looking at your notes. Come back later to check that it stuck.' },
      { question: 'Can AI generate practice questions for each topic of my notes?', answer: 'Yes. Evaluo organizes your PDF or Word file into topics and generates practice questions for each one. As with any AI-generated content, check answers that depend on formulas, tables or scanned pages.' },
    ],
    reviewed: '2026-11-06',
    product: {
      title: 'How topic-based practice works in Evaluo',
      intro: 'Evaluo organizes your notes into topics and keeps your results by topic, so the next thing to study is always visible.',
      points: [
        { title: 'Questions for each topic', detail: 'Multiple-choice, true/false, matching and practical-case questions generated from each topic of your document.' },
        { title: 'Results and progress by topic', detail: 'See which topics you have mastered and which need review, instead of one overall score.' },
        { title: 'Explanations and review', detail: 'Answers come with explanations, and you can go back to the topic summary before trying again.' },
      ],
      plan: 'The Free plan includes 12 multiple-choice and 10 true/false questions, 2 practical cases and 1 matching round for one document. Premium adds up to 3 new uploads per day and more explanations and exercises to review mistakes.',
    },
  },
  'study-pdf-with-ai': {
    path: '/en/study-pdf-with-ai',
    title: 'Study a PDF with AI, Free: Summaries, Quizzes and Flashcards',
    description: 'Study a PDF with AI for free: choose your file without signing up and get topic summaries, flashcards and practice questions based on your own notes.',
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

export const ENGLISH_PAGE_ORDER: EnglishPageKey[] = [
  'home',
  'ai-for-students',
  'ai-test-prep',
  'practice-by-topic',
  'ai-pdf-summarizer',
  'pdf-to-mind-map',
  'pdf-to-quiz',
  'pdf-to-flashcards',
  'study-pdf-with-ai',
];

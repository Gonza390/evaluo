export type StudyBlogWorkshopTable = {
  title: string;
  columns: string[];
  rows: string[][];
  caption: string;
};

export type StudyBlogWorkshop = {
  eyebrow: string;
  title: string;
  intro: string;
  table: StudyBlogWorkshopTable;
  walkthrough: {
    title: string;
    intro: string;
    steps: string[];
    outcome: string;
  };
  secondTable: StudyBlogWorkshopTable;
  practice: {
    title: string;
    instructions: string;
    items: Array<{ question: string; answer: string }>;
  };
  action: {
    title: string;
    text: string;
    steps: string[];
  };
  sources: Array<{ title: string; url: string }>;
  related: Array<{ label: string; slug: string }>;
};

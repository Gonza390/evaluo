export type LearningFilters = {
  period: '1'|'7'|'14'|'30'|'custom';
  from: string|null;
  to: string|null;
  university: string|null;
  career: string|null;
  subject: string|null;
  plan: 'all'|'free'|'premium';
};

export type LearningSnapshot = {
  as_of:string;
  period_days:number;
  overall:{
    students:number;
    started_events:number;
    completed_mode_sessions:number;
    completed_events:number;
    questions:number;
    correct:number;
    repeated_items:number;
    repeated_users:number;
    before_correct:number;
    after_correct:number;
  };
  topics:Array<{topic:string;subject:string;students:number;answers:number;correct:number}>;
  tools:Array<{name:string;students:number|null;started:number|null;finished:number|null;correct:number|null;answers:number|null;note:string}>;
  sim:{started:number;finished:number;users:number;score_sample:number;avg_score:number|null};
  scores:Array<{bucket:string;attempts:number}>;
  errors:{with_errors:number;reviewed:number;resolved:number;check_answered:number;error_items:number};
  subjects:Array<{
    subject_id:string;subject:string;students:number;answers:number;correct:number;
    free_answers:number;free_correct:number;free_users:number;
    premium_answers:number;premium_correct:number;premium_users:number;
  }>;
  options:{
    universities:Array<{value:string;label:string}>;
    careers:Array<{value:string;label:string}>;
    subjects:Array<{value:string;label:string}>;
  };
};

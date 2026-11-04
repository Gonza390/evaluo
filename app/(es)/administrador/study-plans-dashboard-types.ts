export type StudyPlanAdminFilters = {
  period: '1'|'7'|'14'|'30'|'custom'; from: string|null; to: string|null;
  university: string|null; career: string|null; subject: string|null;
  duration: 'all'|'upto7'|'8to14'|'15to30'|'over30';
  state: 'all'|'active'|'not_started'|'interrupted';
};
export type StudyPlanAdminSnapshot = {
  from:string; through:string; previous_created:number;
  summary:{
    plans:number;students:number;active:number;not_started:number;interrupted:number;
    began:number;all_read:number;scheduled_topics:number;read_topics:number;practices_done:number;
    due_topics:number;due_readings:number;over_budget:number;expired_exams:number;
    avg_days_to_exam:number|null;avg_daily_minutes:number|null;
  };
  weeks:Array<{week:number;scheduled:number;read:number}>;
  duration:Array<{bucket:string;n:number}>;
  minutes:Array<{minutes:number;n:number}>;
  distribution:Array<{bucket:string;n:number}>;
  comparison:Array<{group_key:'with_plan'|'no_plan';users:number;answers:number;correct:number;study_days:number}>;
  options:{
    universities:Array<{value:string;label:string}>;
    careers:Array<{value:string;label:string}>;
    subjects:Array<{value:string;label:string}>;
  };
};
export type ActivationCohortRow = {
 d:string;device:string;source:string;file_type:string;first_path:string;premium:boolean;
 registered:number;uploaded:number;ready:number;failed:number;
 opened_material:number;summary:number;studied:number;practice_started:number;practice_finished:number;
 funnel_summary:number;funnel_practice:number;funnel_finished:number;flashcards:number;
 guide_started:number;guide_completed:number;academic_profile:number;university:number;career:number;
 profile_completed:number;read_finished:number;direct_finished:number;
 study_minutes_sum:number|null;study_minutes_count:number;
 practice_minutes_sum:number|null;practice_minutes_count:number;
};
export type ActivationCohortSnapshot = {
 from:string;through:string;coverage:string;rows:ActivationCohortRow[];
};

export type SystemAiSnapshot={
 period_days:number;
 summary:{
  materials:{uploaded:number;ready:number;failed:number;pending:number;stuck:number};
  jobs:{jobs:number;retries:number;avg_seconds:number|null;p95_seconds:number|null};
  ai:{requests:number;tokens:number;prompt_tokens:number;completion_tokens:number;materials:number};
  client_errors:number;observed_groups:number;
 };
 types:Array<{file_type:string;uploaded:number;ready:number;failed:number;pending:number;stuck:number}>;
 reasons:Array<{label:string;n:number}>;
 ai_functions:Array<{name:string;requests:number;tokens:number;prompt_tokens:number;completion_tokens:number}>;
 daily:Array<{d:string;requests:number;tokens:number}>;
 incidents:Array<{area:string;title:string;first_seen:string;last_seen:string;occurrences:number;state:string;severity:string}>;
 performance:Array<{ord:number;name:string;note:string;errors:number}>;
 infra:{database_bytes:number;storage:{objects:number;bytes:number}};
};
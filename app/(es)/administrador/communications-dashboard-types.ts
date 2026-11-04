export type CommunicationsFilters={
 period:'1'|'7'|'14'|'30'|'custom';
 from:string|null;to:string|null;
 type:'all'|'exam'|'ready'|'recovery'|'review'|'campaign'|'welcome';
 template:'all'|'exam_7'|'exam_3'|'exam_1'|'ready'|'return_48h'|'return_d1'|'return_30d'|'flashcards'|'welcome'|'other';
 status:'all'|'sent'|'failed'|'pending'|'sending'|'cancelled';
 campaign:'all'|'automatic'|'exam'|'recovery'|'manual';
};
export type CommunicationsSnapshot={
 from:string;through:string;
 summary:{sent:number;failed:number;pending:number;sending:number;cancelled:number;recipients:number;last_sent:string|null};
 previous:number;
 impact:{eligible:number;returned_mails:number;studied_mails:number;unique_returned:number;unique_studied:number};
 flows:Array<{kind:string;records:number;sent:number;failed:number;last_sent:string|null}>;
 templates:Array<{kind:string;template:string;campaign:string;records:number;sent:number;failed:number;pending:number;last_sent:string|null;eligible:number;returned_mails:number;studied_mails:number;study_users:number}>;
 reminders:Array<{days:number;records:number;sent:number;pending:number;failed:number}>;
 upcoming:Array<{exam_date:string;reminder_days:number;subject:string}>;
 upcoming_total:number;
 reasons:Array<{label:string;n:number}>;
 daily:Array<{day:string;sent:number}>;
};

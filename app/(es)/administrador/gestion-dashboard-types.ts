export type GestionSnapshot = {
  admins: Array<{id:string; nombre:string|null; last_sign_in_at:string|null; mfa_enabled:boolean}>;
  requests: Array<{
    id:string; kind:'university'|'career'|'subject'; title:string; origin:string;
    created_at:string|null; status:string; parent_approved:boolean;
  }>;
  feedback: Array<{
    source:'product'|'simulator'|'material'; id:string; description:string;
    category:string; created_at:string; submitted_by:string; status:'open'|'in_progress'|'resolved';
    updated_at:string|null;
  }>;
  audit: Array<{id:string;created_at:string;actor:string;action:string;object_type:string;
    object_id:string;before_state:Record<string,unknown>|null;after_state:Record<string,unknown>|null;
    result:'success'|'denied'|'error'}>;
  request_summary:{pending:number;universities_pending:number};
  feedback_summary:{open_feedback:number;errors:number};
  academic_summary:{universities:number;careers:number;subjects:number};
  policy:{real_roles:string;hierarchical_roles_enabled:boolean;settings_editable:boolean;configuration_source:string};
};
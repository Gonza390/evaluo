export type UsersRetentionSnapshot = {
  period: number;
  today: string;
  totals: { registered: number; new_users: number; active_users: number; studied_users: number; dau: number; wau: number; mau: number };
  previous: { prev_new: number };
  plan_distribution: { premium_users: number; free_users: number };
  daily: Array<{ d: string; new_users: number; active_users: number; studied_users: number }>;
  retention: Record<'d1'|'d7'|'d30',{ eligible: number; returned: number }>;
  cohorts: Array<{ week: string; users: number; d1_eligible: number; d1_returned: number; d7_eligible: number; d7_returned: number; d30_eligible: number; d30_returned: number }>;
  frequency: { once: number; two_three: number; four_plus: number; avg_study_days: number };
  abandonment: { new_no_study: number; once_then_left: number; inactive_7: number; inactive_14: number; inactive_30: number; reactivated: number };
  segments: UsersSegment[];
};
export type UsersSegment = { dimension: string; name: string; users: number; nuevos: number; activos: number; estudiaron: number };
export type UserListRow = {
  id: string; email: string | null; name: string; created_at: string; last_sign_in_at: string | null;
  university: string; career: string; country: string; plan: string; materials: number; last_activity: string | null; studied: boolean;
};
export type UserListResult = { total: number; page: number; page_size: number; rows: UserListRow[] };
export type UserDetail = {
  id: string; email: string | null; name: string; registered_at: string; last_login: string | null;
  university: string; career: string; plan: string; last_activity: string | null;
  materials: Array<{ id: string; title: string; file_name: string; processing_status: string; created_at: string }>;
  materials_total: number; practice_sessions: number; answered_questions: number; first_practice: string | null;
  study_plan: { exam_date: string; daily_minutes: number; created_at: string; planned_days: number } | null;
};
export type RetentionFilters = {
  period: number; from: string | null; to: string | null; page: number; search: string;
  plan: string; materials: string; country: string; university: string; selectedUserId: string | null;
};

export type AcquisitionRow = {
  d: string;
  channel: string;
  page_type: string;
  landing: string;
  campaign: string;
  utm_source: string;
  utm_medium: string;
  utm_content: string;
  device: string;
  sessions: number;
  clicks: number;
  signup_started: number;
  registered: number;
  uploaded: number;
  studied_sessions: number;
  activated: number;
  step_signup_started: number;
  step_registered: number;
  step_uploaded: number;
  step_studied: number;
};

export type AcquisitionSnapshot = {
  from: string;
  through: string;
  coverage: string;
  rows: AcquisitionRow[];
};

export type ReportReason = 'Fake event' | 'Wrong info' | 'Inappropriate content' | 'Other';

export interface IReport {
  id: string;
  listing_id: string;
  reported_by: string | null;
  reason: ReportReason;
  description: string | null;
  created_at: string;
}

import React, { useState, useCallback } from 'react';
import { Flag } from 'lucide-react';
import { createReport } from '../../services/report.service';
import { REPORT_REASONS } from '../../constants/categories';
import { useToast } from '../ui/Toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import type { ReportReason } from '../../types/report.types';

interface IReportButtonProps {
  listingId: string;
}

const ReportButton: React.FC<IReportButtonProps> = ({ listingId }) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>(REPORT_REASONS[0]);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = useCallback(async () => {
    setLoading(true);
    const { error } = await createReport(listingId, reason, description || undefined);
    if (error) {
      toast(error, 'error');
    } else {
      toast('Report submitted. Thank you.', 'success');
      setOpen(false);
      setDescription('');
    }
    setLoading(false);
  }, [listingId, reason, description, toast]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-nz-muted hover:text-red-400 transition-colors"
        type="button"
      >
        <Flag size={14} />
        Report this listing
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Report Listing">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-nz-muted block mb-1">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportReason)}
              className="w-full bg-nz-elevated border border-nz-border rounded-lg px-3 py-2.5 text-nz-text text-sm outline-none focus:ring-2 focus:ring-nz-accent/50"
            >
              {REPORT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-nz-muted block mb-1">
              Additional details (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Tell us more..."
              className="w-full bg-nz-elevated border border-nz-border rounded-lg px-3 py-2.5 text-nz-text text-sm placeholder:text-nz-muted outline-none focus:ring-2 focus:ring-nz-accent/50 resize-none"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="danger" onClick={handleSubmit} loading={loading} className="flex-1">
              Submit Report
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ReportButton;

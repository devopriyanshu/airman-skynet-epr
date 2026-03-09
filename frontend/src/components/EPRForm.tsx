import { useState } from 'react';
import { createEpr, getAssistRemarks } from '../api/client';
import type { EprRecord, EprStatus, EprRoleType, AppMode } from '../types';

interface Props {
  personId: string;
  personRole: EprRoleType;
  evaluatorId: string;
  appMode: AppMode;
  onCreated: (epr: EprRecord) => void;
  onClose: () => void;
}

function RatingSelect({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs text-slate-400 mb-1">{label}</label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="select"
      >
        <option value="">Select…</option>
        {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} / 5</option>)}
      </select>
    </div>
  );
}

export default function EPRForm({ personId, personRole, evaluatorId, appMode: _appMode, onCreated, onClose }: Props) {
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [overallRating, setOverallRating] = useState('');
  const [technicalRating, setTechnicalRating] = useState('');
  const [nonTechnicalRating, setNonTechnicalRating] = useState('');
  const [remarks, setRemarks] = useState('');
  const [status, setStatus] = useState<EprStatus>('draft');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assistLoading, setAssistLoading] = useState(false);
  const [assistError, setAssistError] = useState<string | null>(null);

  const ratingsAllValid =
    overallRating !== '' && technicalRating !== '' && nonTechnicalRating !== '';

  const handleAssist = async () => {
    if (!ratingsAllValid) return;
    setAssistLoading(true);
    setAssistError(null);
    try {
      const res = await getAssistRemarks({
        overallRating: Number(overallRating),
        technicalSkillsRating: Number(technicalRating),
        nonTechnicalSkillsRating: Number(nonTechnicalRating),
      });
      setRemarks(res.suggestedRemarks);
    } catch (e) {
      setAssistError((e as Error).message);
    } finally {
      setAssistLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!periodStart || !periodEnd) {
      setError('Period start and end are required');
      return;
    }
    if (!overallRating || !technicalRating || !nonTechnicalRating) {
      setError('All ratings are required');
      return;
    }

    setSubmitting(true);
    try {
      const created = await createEpr({
        personId,
        evaluatorId,
        roleType: personRole,
        periodStart,
        periodEnd,
        overallRating: Number(overallRating),
        technicalSkillsRating: Number(technicalRating),
        nonTechnicalSkillsRating: Number(nonTechnicalRating),
        remarks: remarks || undefined,
        status,
      });
      onCreated(created);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card animate-slide-up mt-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">New EPR</p>
          <h3 className="text-base font-bold text-white">Create Performance Record</h3>
        </div>
        <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="form-period-start" className="block text-xs text-slate-400 mb-1">Period Start</label>
            <input
              id="form-period-start"
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="input"
              required
            />
          </div>
          <div>
            <label htmlFor="form-period-end" className="block text-xs text-slate-400 mb-1">Period End</label>
            <input
              id="form-period-end"
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="input"
              required
            />
          </div>
        </div>

        <RatingSelect id="form-overall" label="Overall Rating" value={overallRating} onChange={setOverallRating} />
        <RatingSelect id="form-technical" label="Technical Skills Rating" value={technicalRating} onChange={setTechnicalRating} />
        <RatingSelect id="form-nontechnical" label="Non-Technical Skills Rating" value={nonTechnicalRating} onChange={setNonTechnicalRating} />

        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="form-remarks" className="text-xs text-slate-400">Remarks</label>
            <button
              type="button"
              onClick={handleAssist}
              disabled={!ratingsAllValid || assistLoading}
              className={`btn-ghost text-xs py-1 px-2 ${ratingsAllValid ? 'text-brand-400 hover:text-brand-300' : 'text-slate-600 cursor-not-allowed'} disabled:opacity-50`}
            >
              {assistLoading ? (
                <span className="flex items-center gap-1">
                  <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating…
                </span>
              ) : (
                '✨ Generate Suggested Remarks'
              )}
            </button>
          </div>
          {assistError && <p className="text-xs text-red-400 mb-1">{assistError}</p>}
          <textarea
            id="form-remarks"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={4}
            className="input resize-none"
            placeholder="Add remarks…"
          />
        </div>

        <div>
          <label htmlFor="form-status" className="block text-xs text-slate-400 mb-1">Status</label>
          <select
            id="form-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as EprStatus)}
            className="select"
          >
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
          </select>
        </div>

        {error && (
          <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center disabled:opacity-50">
            {submitting ? 'Creating…' : 'Create EPR'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

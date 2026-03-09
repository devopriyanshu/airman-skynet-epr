import { useState } from 'react';
import { updateEpr, getAssistRemarks } from '../api/client';
import type { EprRecord, EprStatus, AppMode } from '../types';

interface Props {
  epr: EprRecord;
  appMode: AppMode;
  onUpdated: (epr: EprRecord) => void;
  onClose: () => void;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  return `${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function RatingBar({ label, rating }: { label: string; rating: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="text-xs font-semibold text-slate-200">{rating}/5</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full transition-all duration-500"
          style={{ width: `${(rating / 5) * 100}%` }}
        />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: EprStatus }) {
  const cls: Record<EprStatus, string> = {
    draft: 'badge-yellow',
    submitted: 'badge-green',
    archived: 'badge-gray',
  };
  return <span className={cls[status]}>{status}</span>;
}

function RatingSelect({ id, label, value, onChange }: { id: string; label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs text-slate-400 mb-1">{label}</label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="select"
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={n}>{n} / 5</option>
        ))}
      </select>
    </div>
  );
}

export default function EPRDetail({ epr, appMode, onUpdated, onClose }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Edit state
  const [overallRating, setOverallRating] = useState(epr.overallRating);
  const [technicalRating, setTechnicalRating] = useState(epr.technicalSkillsRating);
  const [nonTechnicalRating, setNonTechnicalRating] = useState(epr.nonTechnicalSkillsRating);
  const [remarks, setRemarks] = useState(epr.remarks ?? '');
  const [status, setStatus] = useState<EprStatus>(epr.status);

  // AI assist state
  const [assistLoading, setAssistLoading] = useState(false);
  const [assistError, setAssistError] = useState<string | null>(null);

  const canEdit = appMode !== 'Student';

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updateEpr(epr.id, {
        overallRating,
        technicalSkillsRating: technicalRating,
        nonTechnicalSkillsRating: nonTechnicalRating,
        remarks,
        status,
      });
      onUpdated(updated);
      setIsEditing(false);
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setOverallRating(epr.overallRating);
    setTechnicalRating(epr.technicalSkillsRating);
    setNonTechnicalRating(epr.nonTechnicalSkillsRating);
    setRemarks(epr.remarks ?? '');
    setStatus(epr.status);
    setSaveError(null);
    setIsEditing(false);
  };

  const handleAssist = async () => {
    setAssistLoading(true);
    setAssistError(null);
    try {
      const res = await getAssistRemarks({
        overallRating,
        technicalSkillsRating: technicalRating,
        nonTechnicalSkillsRating: nonTechnicalRating,
      });
      setRemarks(res.suggestedRemarks);
    } catch (e) {
      setAssistError((e as Error).message);
    } finally {
      setAssistLoading(false);
    }
  };

  return (
    <div className="card animate-slide-up mt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Performance Record</p>
          <h3 className="text-base font-bold text-white">
            {formatDate(epr.periodStart)} – {formatDate(epr.periodEnd)}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={isEditing ? status : epr.status} />
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {!isEditing ? (
        /* ── View Mode ── */
        <div className="space-y-4">
          <div className="space-y-2.5">
            <RatingBar label="Overall Rating" rating={epr.overallRating} />
            <RatingBar label="Technical Skills" rating={epr.technicalSkillsRating} />
            <RatingBar label="Non-Technical Skills" rating={epr.nonTechnicalSkillsRating} />
          </div>

          {epr.remarks && (
            <div>
              <p className="text-xs text-slate-400 mb-1.5 uppercase tracking-wider">Remarks</p>
              <p className="text-sm text-slate-300 leading-relaxed bg-white/5 rounded-lg p-3 border border-white/10">
                {epr.remarks}
              </p>
            </div>
          )}

          {canEdit && (
            <button onClick={() => setIsEditing(true)} className="btn-primary w-full justify-center">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          )}
        </div>
      ) : (
        /* ── Edit Mode ── */
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <RatingSelect id="edit-overall" label="Overall Rating" value={overallRating} onChange={setOverallRating} />
            <RatingSelect id="edit-technical" label="Technical Skills Rating" value={technicalRating} onChange={setTechnicalRating} />
            <RatingSelect id="edit-nontechnical" label="Non-Technical Skills Rating" value={nonTechnicalRating} onChange={setNonTechnicalRating} />
          </div>

          <div>
            <label htmlFor="edit-status" className="block text-xs text-slate-400 mb-1">Status</label>
            <select
              id="edit-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as EprStatus)}
              className="select"
            >
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="edit-remarks" className="text-xs text-slate-400">Remarks</label>
              <button
                onClick={handleAssist}
                disabled={assistLoading}
                className="btn-ghost text-xs py-1 px-2 text-brand-400 hover:text-brand-300 disabled:opacity-50"
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
              id="edit-remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={4}
              className="input resize-none"
              placeholder="Add remarks…"
            />
          </div>

          {saveError && <p className="text-xs text-red-400">{saveError}</p>}

          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={handleCancel} className="btn-secondary flex-1 justify-center">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

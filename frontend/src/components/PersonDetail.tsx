import { useState, useEffect } from 'react';
import { getEprs, getEprSummary } from '../api/client';
import EPRList from './EPRList';
import EPRDetail from './EPRDetail';
import EPRForm from './EPRForm';
import type { Person, EprRecord, EprSummary, AppMode, EprRoleType } from '../types';

interface Props {
  person: Person;
  appMode: AppMode;
  activeUserId: string;
  eprRefreshKey: number;
  onEprChange: () => void;
}

// Hardcoded admin evaluator ID — same as seed.ts
const ADMIN_EVALUATOR_ID = '00000000-0000-0000-0000-000000000001';

function PerformanceSnapshot({ summary }: { summary: EprSummary }) {
  if (summary.eprCount === 0) {
    return (
      <div className="card mb-4 border border-white/10">
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-semibold">Performance Snapshot</p>
        <p className="text-sm text-slate-500">No submitted records available for analytics.</p>
      </div>
    );
  }

  return (
    <div className="card mb-4 bg-gradient-to-br from-brand-900/30 to-surface-800 border border-brand-700/30 animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Performance Snapshot</span>
      </div>

      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-3xl font-bold text-white">{summary.averageOverallRating}</span>
        <span className="text-slate-400 text-sm">/ 5 overall</span>
        <span className="ml-auto text-xs text-slate-500">{summary.eprCount} record{summary.eprCount !== 1 ? 's' : ''}</span>
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/25">
          <svg className="w-3 h-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span className="text-xs text-blue-300 font-medium">Technical: {summary.averageTechnicalRating}</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25">
          <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-xs text-emerald-300 font-medium">Non-Technical: {summary.averageNonTechnicalRating}</span>
        </div>
      </div>

      {summary.lastThreePeriods.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Recent Trend</p>
          <div className="space-y-1.5">
            {summary.lastThreePeriods.map((period, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="text-xs text-slate-400 w-16 flex-shrink-0">{period.periodLabel}</span>
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all duration-700"
                    style={{ width: `${(period.overallRating / 5) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-300 w-6 text-right">{period.overallRating}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PersonDetail({ person, appMode, activeUserId, eprRefreshKey, onEprChange }: Props) {
  const [eprs, setEprs] = useState<EprRecord[]>([]);
  const [eprsLoading, setEprsLoading] = useState(false);
  const [eprsError, setEprsError] = useState<string | null>(null);
  const [summary, setSummary] = useState<EprSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [selectedEpr, setSelectedEpr] = useState<EprRecord | null>(null);
  const [showForm, setShowForm] = useState(false);

  const canCreateEpr = appMode !== 'Student';

  useEffect(() => {
    setSelectedEpr(null);
    setShowForm(false);

    // Fetch EPRs
    setEprsLoading(true);
    setEprsError(null);
    getEprs(person.id)
      .then(setEprs)
      .catch((e) => setEprsError((e as Error).message))
      .finally(() => setEprsLoading(false));

    // Fetch summary (Level 2A)
    setSummaryLoading(true);
    getEprSummary(person.id)
      .then(setSummary)
      .catch(console.error)
      .finally(() => setSummaryLoading(false));
  }, [person.id, eprRefreshKey]);

  const handleEprUpdated = (updated: EprRecord) => {
    setEprs((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    setSelectedEpr(updated);
    onEprChange();
  };

  const handleEprCreated = (created: EprRecord) => {
    setEprs((prev) => [created, ...prev]);
    setShowForm(false);
    setSelectedEpr(created);
    onEprChange();
  };

  // Determine evaluatorId for new EPR
  const evaluatorId =
    appMode === 'Instructor' || appMode === 'Student' ? activeUserId : ADMIN_EVALUATOR_ID;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Person header */}
      <div className="flex-shrink-0 p-6 border-b border-white/10 glass">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-xl font-bold text-white shadow-lg">
              {person.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{person.name}</h2>
              <p className="text-sm text-slate-400 mt-0.5">{person.email}</p>
              <div className="flex items-center gap-2 mt-1.5">
                {person.role === 'student' ? (
                  <span className="badge-blue">Student</span>
                ) : (
                  <span className="badge-green">Instructor</span>
                )}
                {person.role === 'student' && person.courseName && (
                  <>
                    <span className="text-slate-600 text-xs">•</span>
                    <span className="text-xs text-slate-400">{person.courseName}</span>
                    {person.enrollmentStatus && (
                      <span
                        className={
                          person.enrollmentStatus === 'active'
                            ? 'badge-green'
                            : person.enrollmentStatus === 'completed'
                            ? 'badge-purple'
                            : 'badge-gray'
                        }
                      >
                        {person.enrollmentStatus}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {canCreateEpr && !showForm && (
            <button
              onClick={() => { setShowForm(true); setSelectedEpr(null); }}
              className="btn-primary flex-shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New EPR
            </button>
          )}
        </div>
      </div>

      {/* Main scrollable area */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Performance Snapshot (Level 2A) */}
        {summaryLoading ? (
          <div className="skeleton h-28 rounded-xl mb-4" />
        ) : summary ? (
          <PerformanceSnapshot summary={summary} />
        ) : null}

        {/* EPR section heading */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            Performance Records
          </h3>
          <span className="text-xs text-slate-500">{eprs.length} record{eprs.length !== 1 ? 's' : ''}</span>
        </div>

        {/* EPR list */}
        <EPRList
          eprs={eprs}
          loading={eprsLoading}
          error={eprsError}
          selectedEprId={selectedEpr?.id ?? null}
          onSelectEpr={(epr) => { setSelectedEpr(epr); setShowForm(false); }}
        />

        {/* EPR detail panel */}
        {selectedEpr && !showForm && (
          <EPRDetail
            epr={selectedEpr}
            appMode={appMode}
            onUpdated={handleEprUpdated}
            onClose={() => setSelectedEpr(null)}
          />
        )}

        {/* New EPR form */}
        {showForm && (
          <EPRForm
            personId={person.id}
            personRole={person.role as EprRoleType}
            evaluatorId={evaluatorId}
            appMode={appMode}
            onCreated={handleEprCreated}
            onClose={() => setShowForm(false)}
          />
        )}
      </div>
    </div>
  );
}

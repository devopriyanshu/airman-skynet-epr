import type { EprRecord, EprStatus } from '../types';

interface Props {
  eprs: EprRecord[];
  loading: boolean;
  error: string | null;
  selectedEprId: string | null;
  onSelectEpr: (epr: EprRecord) => void;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatPeriod(start: string, end: string): string {
  const s = new Date(start + 'T00:00:00Z');
  const e = new Date(end + 'T00:00:00Z');
  return `${MONTH_NAMES[s.getUTCMonth()]} ${s.getUTCFullYear()} – ${MONTH_NAMES[e.getUTCMonth()]} ${e.getUTCFullYear()}`;
}

function StatusBadge({ status }: { status: EprStatus }) {
  const classes: Record<EprStatus, string> = {
    draft: 'badge-yellow',
    submitted: 'badge-green',
    archived: 'badge-gray',
  };
  return <span className={classes[status]}>{status}</span>;
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className={`w-3 h-3 ${i <= rating ? 'text-amber-400' : 'text-slate-600'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-xs text-slate-400 ml-1">{rating}/5</span>
    </span>
  );
}

export default function EPRList({ eprs, loading, error, selectedEprId, onSelectEpr }: Props) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-red-400 text-sm py-4 text-center">{error}</p>;
  }

  if (eprs.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-slate-500 text-sm">No performance records found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {eprs.map((epr) => (
        <button
          key={epr.id}
          onClick={() => onSelectEpr(epr)}
          className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${
            selectedEprId === epr.id
              ? 'bg-brand-600/15 border-brand-500/40'
              : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">
                {formatPeriod(epr.periodStart, epr.periodEnd)}
              </p>
              <div className="mt-1.5">
                <RatingStars rating={epr.overallRating} />
              </div>
            </div>
            <StatusBadge status={epr.status} />
          </div>
        </button>
      ))}
    </div>
  );
}

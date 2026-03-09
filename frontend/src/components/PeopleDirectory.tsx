import { useState, useEffect, useCallback, useRef } from 'react';
import { getPeople } from '../api/client';
import type { Person, AppMode } from '../types';

interface Props {
  appMode: AppMode;
  activeUserId: string;
  selectedPerson: Person | null;
  onSelectPerson: (person: Person) => void;
}

type Tab = 'Students' | 'Instructors';

function RoleBadge({ role }: { role: string }) {
  if (role === 'student') return <span className="badge-blue">Student</span>;
  if (role === 'instructor') return <span className="badge-green">Instructor</span>;
  return <span className="badge-gray">{role}</span>;
}

function EnrollmentBadge({ status }: { status?: string | null }) {
  if (!status) return null;
  const cls =
    status === 'active' ? 'badge-green' : status === 'completed' ? 'badge-purple' : 'badge-gray';
  return <span className={cls}>{status}</span>;
}

function PersonCard({
  person,
  isSelected,
  onClick,
}: {
  person: Person;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-xl border transition-all duration-200 mb-2 group ${
        isSelected
          ? 'bg-brand-600/20 border-brand-500/50 shadow-lg shadow-brand-900/20'
          : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                person.role === 'instructor'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-blue-500/20 text-blue-300'
              }`}
            >
              {person.name.charAt(0)}
            </div>
            <span className={`font-semibold text-sm truncate ${isSelected ? 'text-brand-300' : 'text-slate-100'}`}>
              {person.name}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 ml-9 truncate">{person.email}</p>
        </div>
        <RoleBadge role={person.role} />
      </div>

      {/* Student: course + enrollment */}
      {person.role === 'student' && (
        <div className="mt-2 ml-9 flex items-center gap-2 flex-wrap">
          {person.courseName && (
            <span className="text-xs text-slate-400">{person.courseName}</span>
          )}
          <EnrollmentBadge status={person.enrollmentStatus} />
        </div>
      )}

      {/* Instructor: EPR count */}
      {person.role === 'instructor' && (
        <div className="mt-1 ml-9 text-xs text-slate-400">
          {person.totalEprsWritten ?? 0} EPRs written
        </div>
      )}
    </button>
  );
}

export default function PeopleDirectory({ appMode, activeUserId, selectedPerson, onSelectPerson }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('Students');
  const [search, setSearch] = useState('');
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPeople = useCallback(
    async (role: string, searchVal: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = await getPeople({
          role: role.toLowerCase(),
          search: searchVal || undefined,
        });
        setPeople(data);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchPeople(activeTab === 'Students' ? 'student' : 'instructor', search);
  }, [activeTab, fetchPeople]);

  // Debounced search
  const handleSearch = (val: string) => {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchPeople(activeTab === 'Students' ? 'student' : 'instructor', val);
    }, 350);
  };

  // Filter to only show the logged-in student in Student mode
  const visiblePeople =
    appMode === 'Student'
      ? people.filter((p) => p.id === activeUserId)
      : people;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Directory</h2>

        {/* Tabs */}
        <div className="flex rounded-lg overflow-hidden border border-white/10 bg-surface-800 mb-3">
          {(['Students', 'Instructors'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-semibold transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search name or email…"
            className="input pl-9 text-xs"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-16 rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={() => fetchPeople(activeTab === 'Students' ? 'student' : 'instructor', search)}
              className="btn-ghost mt-2 text-xs"
            >
              Retry
            </button>
          </div>
        ) : visiblePeople.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500 text-sm">No {activeTab.toLowerCase()} found</p>
          </div>
        ) : (
          visiblePeople.map((person) => (
            <PersonCard
              key={person.id}
              person={person}
              isSelected={selectedPerson?.id === person.id}
              onClick={() => onSelectPerson(person)}
            />
          ))
        )}
      </div>
    </div>
  );
}

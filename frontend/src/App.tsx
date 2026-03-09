import { useState, useEffect, useCallback } from 'react';
import { getPeople, setCurrentUserId } from './api/client';
import PeopleDirectory from './components/PeopleDirectory';
import PersonDetail from './components/PersonDetail';
import type { Person, AppMode } from './types';

// Hardcoded admin user id (must match seed.ts)
const ADMIN_USER_ID = '00000000-0000-0000-0000-000000000001';

export default function App() {
  const [appMode, setAppMode] = useState<AppMode>('Admin');
  const [selectedUserId, setSelectedUserId] = useState<string>(ADMIN_USER_ID);
  const [modeUsers, setModeUsers] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [eprRefreshKey, setEprRefreshKey] = useState(0);

  // When mode changes, load the list of users for that mode
  useEffect(() => {
    if (appMode === 'Admin') {
      setSelectedUserId(ADMIN_USER_ID);
      setCurrentUserId(ADMIN_USER_ID);
      setModeUsers([]);
    } else {
      const role = appMode === 'Instructor' ? 'instructor' : 'student';
      getPeople({ role })
        .then((people) => {
          setModeUsers(people);
          if (people.length > 0) {
            setSelectedUserId(people[0].id);
            setCurrentUserId(people[0].id);
          }
        })
        .catch(console.error);
    }
  }, [appMode]);

  const handleModeUserChange = useCallback((userId: string) => {
    setSelectedUserId(userId);
    setCurrentUserId(userId);
    // If in student mode and a person is selected who isn't the logged-in student, deselect them
    if (appMode === 'Student') {
      setSelectedPerson(null);
    }
  }, [appMode]);

  const handleEprRefresh = useCallback(() => {
    setEprRefreshKey(k => k + 1);
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-surface-900">
      {/* ── Navbar ── */}
      <nav className="flex-shrink-0 glass border-b border-white/10 px-6 py-3 flex items-center justify-between z-10">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-none">Skynet EPR</h1>
            <p className="text-xs text-slate-400 mt-0.5">AIRMAN Academy</p>
          </div>
        </div>

        {/* Role Switcher (Level 2B) */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Mode</span>
          <div className="flex rounded-lg overflow-hidden border border-white/10 bg-surface-800">
            {(['Admin', 'Instructor', 'Student'] as AppMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setAppMode(mode)}
                className={`px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  appMode === mode
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* User selector for Instructor / Student modes */}
          {appMode !== 'Admin' && modeUsers.length > 0 && (
            <select
              value={selectedUserId}
              onChange={(e) => handleModeUserChange(e.target.value)}
              className="select bg-surface-700 border-white/10 text-slate-200 text-xs py-1.5 px-3 rounded-lg w-48"
            >
              {modeUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          )}

          {/* Active user pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
            <span className="text-xs text-slate-300">
              {appMode === 'Admin'
                ? 'System Admin'
                : modeUsers.find((u) => u.id === selectedUserId)?.name ?? 'Unknown'}
            </span>
          </div>
        </div>
      </nav>

      {/* ── Main layout ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left pane */}
        <div className="w-80 flex-shrink-0 border-r border-white/10 flex flex-col overflow-hidden">
          <PeopleDirectory
            appMode={appMode}
            activeUserId={selectedUserId}
            selectedPerson={selectedPerson}
            onSelectPerson={setSelectedPerson}
          />
        </div>

        {/* Right pane */}
        <div className="flex-1 overflow-hidden">
          {selectedPerson ? (
            <PersonDetail
              person={selectedPerson}
              appMode={appMode}
              activeUserId={selectedUserId}
              eprRefreshKey={eprRefreshKey}
              onEprChange={handleEprRefresh}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center animate-fade-in">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-slate-400 text-sm font-medium">Select a person to view their performance records</p>
                <p className="text-slate-600 text-xs mt-1">Choose from the directory on the left</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

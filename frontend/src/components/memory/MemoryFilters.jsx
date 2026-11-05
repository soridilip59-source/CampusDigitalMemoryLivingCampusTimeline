import { useEffect, useRef } from 'react';
import Icon from '../common/Icon';
import { BATCHES, MEMORY_TYPES, YEARS } from '../../utils/constants';

export default function MemoryFilters({ filters, onChange, stats }) {
  const searchRef = useRef(null);
  const set = (patch) => onChange({ ...filters, ...patch });
  const active = filters.q || filters.year || filters.batch || filters.type;

  // press "/" anywhere to jump to search
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); searchRef.current?.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="card space-y-4 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input ref={searchRef} value={filters.q} onChange={(e) => set({ q: e.target.value })} className="field pl-10" placeholder="Search by title, person, event, project or year  (press /)" aria-label="Search memories" />
        </div>
        <select value={filters.batch} onChange={(e) => set({ batch: e.target.value })} className="field sm:w-40" aria-label="Filter by batch">
          <option value="">All batches</option>
          {BATCHES.map((b) => <option key={b}>{b}</option>)}
        </select>
        <button onClick={() => set({ sort: filters.sort === 'desc' ? 'asc' : 'desc' })} className="chip justify-center" aria-label="Change order">
          <Icon name="sort" className="h-4 w-4" /> {filters.sort === 'desc' ? 'Newest first' : 'Oldest first'}
        </button>
      </div>

      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <button className={`chip ${!filters.year ? 'chip-on' : ''}`} onClick={() => set({ year: '' })}>All years</button>
        {YEARS.map((y) => (
          <button key={y} className={`chip ${String(filters.year) === String(y) ? 'chip-on' : ''}`} onClick={() => set({ year: filters.year === y ? '' : y })}>
            {y}{stats?.years?.[y] ? <span className="text-xs opacity-60">{stats.years[y]}</span> : null}
          </button>
        ))}
      </div>

      <div className="no-scrollbar -mx-1 flex items-center gap-2 overflow-x-auto px-1">
        {MEMORY_TYPES.map((t) => (
          <button key={t.value} className={`chip ${filters.type === t.value ? 'chip-on' : ''}`} onClick={() => set({ type: filters.type === t.value ? '' : t.value })}>
            {t.emoji} {t.label}
          </button>
        ))}
        {active && (
          <button className="chip ml-auto text-rose-600" onClick={() => onChange({ q: '', year: '', batch: '', type: '', sort: filters.sort })}>Clear filters</button>
        )}
      </div>
    </div>
  );
}

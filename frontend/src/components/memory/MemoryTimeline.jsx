import { memo, useMemo } from 'react';
import MemoryCard from './MemoryCard';

/** Groups an already-sorted list by year and draws the rail. Cards alternate sides on desktop. */
function MemoryTimeline({ items, onOpen, onLike, onReact }) {
  const groups = useMemo(() => {
    const out = [];
    items.forEach((m) => {
      const last = out[out.length - 1];
      if (last && last.year === m.year) last.items.push(m);
      else out.push({ year: m.year, items: [m] });
    });
    return out;
  }, [items]);

  return (
    <div className="space-y-14">
      {groups.map((g) => (
        <section key={g.year} id={`year-${g.year}`} aria-label={`Memories from ${g.year}`}>
          <div className="sticky z-20 -mx-4 mb-8 bg-paper/85 px-4 py-2 backdrop-blur-md dark:bg-night/85" style={{ top: 'var(--header-h)' }}>
            <div className="flex items-baseline gap-3 md:justify-center">
              <h2 className="year-outline font-display text-6xl font-extrabold leading-none text-brand-600 dark:text-brand-400 sm:text-7xl">{g.year}</h2>
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{g.items.length} {g.items.length === 1 ? 'memory' : 'memories'} loaded</span>
            </div>
          </div>

          <ol className="relative space-y-8 pl-8 before:absolute before:bottom-0 before:left-3 before:top-0 before:w-0.5 before:bg-gradient-to-b before:from-brand-400 before:to-brand-400/0 md:pl-0 md:before:left-1/2">
            {g.items.map((m, i) => (
              <li key={m.id} className={`relative md:w-1/2 ${i % 2 === 0 ? 'md:pr-10' : 'md:ml-auto md:pl-10'}`}>
                <span className={`absolute top-8 h-3.5 w-3.5 rounded-full bg-brand-600 ring-4 ring-paper dark:ring-night -left-[26px] ${i % 2 === 0 ? 'md:left-auto md:-right-[7px]' : 'md:-left-[7px]'}`} />
                <MemoryCard memory={m} onOpen={onOpen} onLike={onLike} onReact={onReact} />
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

export default memo(MemoryTimeline);

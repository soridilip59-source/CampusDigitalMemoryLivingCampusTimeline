import { useEffect, useState } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import Icon from '../common/Icon';
import ImageUploader from './ImageUploader';
import useDebounce from '../../hooks/useDebounce';
import * as memoryApi from '../../api/memoryApi';
import { BATCHES, CURRENT_YEAR, MEMORY_TYPES, YEARS } from '../../utils/constants';

const validate = (f) => {
  const e = {};
  if (f.title.trim().length < 5) e.title = 'Give it a title of at least 5 characters.';
  if (f.description.trim().length < 30) e.description = 'Tell the story in at least 30 characters.';
  if (f.eventDate && new Date(f.eventDate).getFullYear() !== Number(f.year)) e.eventDate = 'This date must fall inside the selected year.';
  return e;
};

export default function MemoryForm({ onSubmit, onChange, submitting, defaultBatch }) {
  const [f, setF] = useState({
    title: '', description: '', year: CURRENT_YEAR, eventDate: '', type: 'event',
    batch: defaultBatch && BATCHES.includes(defaultBatch) ? defaultBatch : `Batch ${CURRENT_YEAR}`,
    tags: '', related: '', images: [],
  });
  const [errors, setErrors] = useState({});
  const [dups, setDups] = useState([]);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const dTitle = useDebounce(f.title, 600);

  useEffect(() => { onChange?.(f); }, [f, onChange]);

  // live duplicate check while typing
  useEffect(() => {
    if (dTitle.trim().length < 5) { setDups([]); return; }
    let live = true;
    memoryApi.checkDuplicates({ title: dTitle, description: f.description, year: f.year }).then((r) => live && setDups(r)).catch(() => {});
    return () => { live = false; };
  }, [dTitle, f.year]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = (e) => {
    e.preventDefault();
    const v = validate(f);
    setErrors(v);
    if (Object.keys(v).length) return;
    onSubmit({ ...f, year: Number(f.year), tags: f.tags.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean).slice(0, 6) });
  };

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <Input label="Title" value={f.title} onChange={(e) => set('title', e.target.value)} error={errors.title} maxLength={90} placeholder="e.g. First hackathon in the common hall" />

      {dups.length > 0 && (
        <div className="flex gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-400/20" role="alert">
          <Icon name="alert" className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold">This looks similar to a memory that already exists</p>
            <ul className="mt-1 list-disc pl-4">{dups.map((d) => <li key={d.id}>{d.title} <span className="opacity-70">({d.year}, {d.status})</span></li>)}</ul>
            <p className="mt-1 opacity-80">You can still submit. Admins will compare both before publishing.</p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input as="select" label="Year" value={f.year} onChange={(e) => set('year', e.target.value)}>
          {YEARS.map((y) => <option key={y}>{y}</option>)}
        </Input>
        <Input as="select" label="Batch" value={f.batch} onChange={(e) => set('batch', e.target.value)}>
          {BATCHES.map((b) => <option key={b}>{b}</option>)}
        </Input>
      </div>

      <div>
        <span className="mb-1.5 block text-sm font-semibold">What kind of memory is it?</span>
        <div className="flex flex-wrap gap-2">
          {MEMORY_TYPES.map((t) => (
            <button type="button" key={t.value} onClick={() => set('type', t.value)} className={`chip ${f.type === t.value ? 'chip-on' : ''}`} aria-pressed={f.type === t.value}>{t.emoji} {t.label}</button>
          ))}
        </div>
      </div>

      <Input as="textarea" rows={6} label="The story" value={f.description} onChange={(e) => set('description', e.target.value)} error={errors.description}
        maxLength={1500} hint={`${f.description.length}/1500. Who was there, what happened, why it mattered.`} placeholder="Tell future batches what it was like…" />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input type="date" label="Exact date (optional)" value={f.eventDate} onChange={(e) => set('eventDate', e.target.value)} error={errors.eventDate} />
        <Input label="Connected event or project (optional)" value={f.related} onChange={(e) => set('related', e.target.value)} placeholder="e.g. Hackathon 1.0" maxLength={80} />
      </div>
      <Input label="Tags (comma separated)" value={f.tags} onChange={(e) => set('tags', e.target.value)} placeholder="hackathon, teamwork, web" hint="Helps people find your memory through search." />

      <ImageUploader value={f.images} onChange={(v) => set('images', v)} />

      <Button type="submit" size="lg" loading={submitting} className="w-full">Send for review</Button>
    </form>
  );
}

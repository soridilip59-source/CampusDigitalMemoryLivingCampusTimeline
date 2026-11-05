import { useEffect, useState } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import Icon from '../common/Icon';
import ImageUploader from './ImageUploader';
import useDebounce from '../../hooks/useDebounce';
import * as memoryApi from '../../api/memoryApi';
import { BATCHES, CURRENT_YEAR, MEMORY_TYPES, START_YEAR, YEARS, MAX_IMAGES } from '../../utils/constants';

const validate = (f) => {
  const errors = {};
  if (f.title.trim().length < 5) errors.title = 'Give it a title of at least 5 characters.';
  if (f.description.trim().length < 20) errors.description = 'Tell the story in at least 20 characters.';
  if (!Number.isInteger(Number(f.year)) || Number(f.year) < START_YEAR || Number(f.year) > CURRENT_YEAR) errors.year = 'Choose a valid year.';
  if (f.eventDate && new Date(f.eventDate).getFullYear() !== Number(f.year)) errors.eventDate = 'This date must fall inside the selected year.';
  if ((f.images || []).length > MAX_IMAGES) errors.images = `Choose up to ${MAX_IMAGES} photos.`;
  return errors;
};

export default function MemoryForm({ onSubmit, onChange, submitting, defaultBatch, initial }) {
  const [f, setF] = useState({ title: '', description: '', year: CURRENT_YEAR, eventDate: '', type: 'event', batch: defaultBatch && BATCHES.includes(defaultBatch) ? defaultBatch : `Batch ${CURRENT_YEAR}`, tags: '', related: '', images: [], ...initial });
  const [errors, setErrors] = useState({}); const [dups, setDups] = useState([]); const [step, setStep] = useState(0);
  const set = (key, value) => setF((prev) => ({ ...prev, [key]: value })); const dTitle = useDebounce(f.title, 600);
  useEffect(() => { onChange?.(f); }, [f, onChange]);
  useEffect(() => { if (dTitle.trim().length < 5) { setDups([]); return; } let live = true; memoryApi.checkDuplicates({ title: dTitle, description: f.description, year: f.year }).then((r) => live && setDups(r)).catch(() => {}); return () => { live = false; }; }, [dTitle, f.year]);
  const continueStep = () => { const all = validate(f); const current = step === 0 ? ['title', 'year', 'eventDate'] : ['images']; const nextErrors = Object.fromEntries(Object.entries(all).filter(([key]) => current.includes(key))); setErrors(nextErrors); if (Object.keys(nextErrors).length) return; setStep((n) => Math.min(2, n + 1)); };
  const submit = (e) => { e.preventDefault(); const validation = validate(f); setErrors(validation); if (Object.keys(validation).length) { setStep(validation.title || validation.year || validation.eventDate ? 0 : validation.images ? 1 : 2); return; } onSubmit({ ...f, year: Number(f.year), tags: f.tags.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean).slice(0, 6) }); };
  return <form onSubmit={submit} className="space-y-5" noValidate>
    <div><div className="mb-2 flex justify-between text-xs font-semibold text-slate-500"><span>Step {step + 1} of 3 · {['Basics', 'Photos', 'Review'][step]}</span><span>{Math.round(((step + 1) / 3) * 100)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10"><div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${((step + 1) / 3) * 100}%` }}/></div></div>
    {step === 0 && <>
      <Input label="Title" value={f.title} onChange={(e) => set('title', e.target.value)} error={errors.title} maxLength={90} placeholder="e.g. First hackathon in the common hall"/>
      <div className="grid gap-4 sm:grid-cols-2"><Input as="select" label="Year" value={f.year} onChange={(e) => set('year', e.target.value)} error={errors.year}>{YEARS.map((y) => <option key={y}>{y}</option>)}</Input><Input as="select" label="Batch" value={f.batch} onChange={(e) => set('batch', e.target.value)}>{BATCHES.map((b) => <option key={b}>{b}</option>)}</Input></div>
      <div><span className="mb-1.5 block text-sm font-semibold">What kind of memory is it?</span><div className="flex flex-wrap gap-2">{MEMORY_TYPES.map((t) => <button type="button" key={t.value} onClick={() => set('type', t.value)} className={`chip ${f.type === t.value ? 'chip-on' : ''}`} aria-pressed={f.type === t.value}>{t.emoji} {t.label}</button>)}</div></div>
      <Input type="date" label="Exact date (optional)" value={f.eventDate} onChange={(e) => set('eventDate', e.target.value)} error={errors.eventDate}/>
    </>}
    {step === 1 && <ImageUploader value={f.images} onChange={(v) => set('images', v)} error={errors.images}/>}
    {step === 2 && <>
      <Input as="textarea" rows={6} label="The story" value={f.description} onChange={(e) => set('description', e.target.value)} error={errors.description} maxLength={1500} hint={`${f.description.length}/1500 · at least 20 characters`} placeholder="Tell future batches what it was like…"/>
      <div className="grid gap-4 sm:grid-cols-2"><Input label="Connected event or project (optional)" value={f.related} onChange={(e) => set('related', e.target.value)} placeholder="e.g. Hackathon 1.0" maxLength={80}/><Input label="Tags (comma separated)" value={f.tags} onChange={(e) => set('tags', e.target.value)} placeholder="hackathon, teamwork, web"/></div>
      {dups.length > 0 && <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-400/10 dark:text-amber-200" role="status"><Icon name="alert" className="mr-2 inline h-4 w-4"/>Similar memories: {dups.map((d) => d.title).join(', ')}</div>}
      <div className="rounded-xl bg-brand-50 p-4 text-sm dark:bg-brand-500/10"><b>{f.title || 'Untitled memory'}</b><p className="mt-1 text-slate-600 dark:text-slate-300">{f.year} · {f.type} · {f.images.length} photos</p></div>
    </>}
    <div className="flex justify-between gap-2"><Button type="button" variant="secondary" disabled={step === 0 || submitting} onClick={() => setStep((n) => n - 1)}>Back</Button>{step < 2 ? <Button type="button" onClick={continueStep} disabled={submitting}>Continue</Button> : <Button type="submit" size="lg" loading={submitting} className="ml-auto">Send for review</Button>}</div>
  </form>;
}

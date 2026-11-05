import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import * as memoryApi from '../api/memoryApi';
import { useToast } from '../context/ToastContext';
import MemoryForm from '../components/memory/MemoryForm';
import MemoryCard from '../components/memory/MemoryCard';

export default function SubmitMemory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState(null);
  const [initial] = useState(() => { const key = `cdm_draft_${user.id}`; const saved = localStorage.getItem(key); if (saved && window.confirm('Restore your saved memory draft?')) { try { return JSON.parse(saved); } catch { localStorage.removeItem(key); } } return null; });
  const saveDraft = useCallback((value) => { setDraft(value); localStorage.setItem(`cdm_draft_${user.id}`, JSON.stringify(value)); }, [user.id]);

  const onSubmit = async (payload) => {
    setBusy(true);
    try {
      const { duplicates } = await memoryApi.create(payload);
      localStorage.removeItem(`cdm_draft_${user.id}`);
      toast.success('Sent for review. You will be notified when it is published.');
      if (duplicates?.length) toast.warn('It looks similar to an existing memory, so admins will compare them.');
      navigate('/my-submissions');
    } catch (e) { toast.error(e.message); setBusy(false); }
  };

  const preview = {
    id: 'preview', title: draft?.title || 'Your title appears here', description: draft?.description || 'Your story appears here as you type. Add photos to give it a cover.',
    year: draft?.year, type: draft?.type || 'event', batch: draft?.batch, eventDate: draft?.eventDate, images: draft?.images || [],
    contributor: { name: user.name }, likesCount: 0, liked: false,
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[1fr_380px]">
      <div>
        <h1 className="text-3xl font-extrabold sm:text-4xl">Add a campus memory</h1>
        <p className="mb-8 mt-2 text-slate-500">Admins review every memory before it reaches the timeline.</p>
        <MemoryForm initial={initial || undefined} onSubmit={onSubmit} onChange={saveDraft} submitting={busy} defaultBatch={user.batch} />
      </div>
      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <p className="mb-3 text-sm font-semibold text-slate-500">Live preview</p>
          <MemoryCard memory={preview} preview />
        </div>
      </aside>
    </div>
  );
}

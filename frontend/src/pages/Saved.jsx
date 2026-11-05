import { useEffect, useState } from 'react';
import useAuth from '../hooks/useAuth';
import { readSaved } from '../utils/saved';
import * as memoryApi from '../api/memoryApi';
import MemoryCard from '../components/memory/MemoryCard';
import MemoryDetail from '../components/memory/MemoryDetail';
import { EmptyState, PageLoader } from '../components/common/Loader';

export default function Saved() {
  const { user } = useAuth(); const [items, setItems] = useState(null); const [open, setOpen] = useState(null);
  useEffect(() => { const ids = readSaved(user.id); Promise.all(ids.map((id) => memoryApi.getById(id).catch(() => null))).then((rows) => setItems(rows.filter(Boolean))); }, [user.id]);
  if (!items) return <PageLoader />;
  return <main className="mx-auto max-w-6xl px-4 py-10"><h1 className="text-3xl font-extrabold">Saved memories</h1>{items.length ? <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.map((m) => <MemoryCard key={m.id} memory={m} onOpen={setOpen} />)}</div> : <div className="mt-8"><EmptyState emoji="🔖" title="No saved memories yet" text="Bookmark a memory to keep it close." /></div>}<MemoryDetail memory={open} onClose={() => setOpen(null)} /></main>;
}

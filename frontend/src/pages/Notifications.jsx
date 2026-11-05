import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as memoryApi from '../api/memoryApi';
import Avatar from '../components/common/Avatar';
import { EmptyState, PageLoader } from '../components/common/Loader';
import { timeAgo } from '../utils/formatDate';
import { realtime, EV } from '../utils/realtime';

export default function Notifications() {
  const [items, setItems] = useState(null); const navigate = useNavigate();
  const load = () => memoryApi.listNotifications().then(setItems).catch(() => setItems([]));
  useEffect(() => { load(); return realtime.on(EV.NOTIFY, load); }, []);
  if (!items) return <PageLoader />;
  return <main className="mx-auto max-w-3xl px-4 py-10"><div className="flex items-center justify-between"><h1 className="text-3xl font-extrabold">Notifications</h1><button className="text-sm font-semibold text-brand-600" onClick={async () => { await memoryApi.markAllRead(); load(); }}>Mark all as read</button></div>
    <div className="mt-6 space-y-2">{!items.length ? <EmptyState emoji="🔔" title="You’re all caught up" text="Activity on your memories will show up here." /> : items.map((n) => <button key={n.id} onClick={async () => { await memoryApi.markNotificationRead(n.id); navigate(`/?m=${n.memoryId}`); }} className={`card flex w-full items-center gap-3 p-4 text-left ${n.read ? 'opacity-70' : 'ring-2 ring-brand-300'}`}><Avatar name={n.actorName} /><span className="min-w-0 flex-1"><span className="block font-semibold">{n.text}</span><span className="block truncate text-sm text-slate-500">{n.memoryTitle} · {timeAgo(n.createdAt)}</span></span>{!n.read && <span className="h-2 w-2 rounded-full bg-brand-500" />}</button>)}</div>
  </main>;
}

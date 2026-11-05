import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as memoryApi from '../../api/memoryApi';
import { realtime, EV } from '../../utils/realtime';
import Icon from '../common/Icon';
import Avatar from '../common/Avatar';
import { timeAgo } from '../../utils/formatDate';

export default function NotificationBell() {
  const [items, setItems] = useState([]); const [unread, setUnread] = useState(0); const [open, setOpen] = useState(false); const navigate = useNavigate();
  useEffect(() => { const load = () => Promise.all([memoryApi.listNotifications(), memoryApi.unreadCount()]).then(([n,c]) => { setItems(n.slice(0,8)); setUnread(c); }).catch(() => {}); load(); return realtime.on(EV.NOTIFY, load); }, []);
  return <div className="relative"><button aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} aria-expanded={open} onClick={() => setOpen((v) => !v)} className="relative rounded-lg p-2 hover:bg-slate-900/5 dark:hover:bg-white/10"><Icon name="bell"/>{unread > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-coral-500 px-1.5 text-[10px] font-bold text-white">{unread}</span>}</button>{open && <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl dark:border-white/10 dark:bg-[#171629]"><div className="flex items-center justify-between px-2 pb-2"><b>Notifications</b><button className="text-xs text-brand-600" onClick={async () => { await memoryApi.markAllRead(); setUnread(0); setItems((all) => all.map((n) => ({ ...n, read: true }))); }}>Mark all read</button></div>{items.length ? items.map((n) => <button key={n.id} onClick={async () => { await memoryApi.markNotificationRead(n.id); setOpen(false); navigate(`/?m=${n.memoryId}`); }} className="flex w-full gap-2 rounded-xl p-2 text-left hover:bg-slate-100 dark:hover:bg-white/10"><Avatar name={n.actorName}/><span className="min-w-0 text-xs"><b className="block truncate">{n.text}</b><span className="text-slate-500">{timeAgo(n.createdAt)}</span></span></button>) : <p className="p-4 text-center text-sm text-slate-500">No notifications yet</p>}</div>}</div>;
}

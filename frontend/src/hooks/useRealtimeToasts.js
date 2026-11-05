import { useEffect } from 'react';
import useAuth from './useAuth';
import { useToast } from '../context/ToastContext';
import { realtime, EV } from '../utils/realtime';

/** One place that turns live events into friendly toasts. */
export default function useRealtimeToasts() {
  const { user, isAdmin } = useAuth();
  const toast = useToast();

  useEffect(() => {
    const offs = [
      realtime.on(EV.PUBLISHED, (m) => toast.info(`🎉 New on the timeline: ${m.title}`)),
      realtime.on(EV.UPDATED, ({ memory, changed }) => toast.info(`✏️ Updated ${changed.join(' & ')} of “${memory.title}”`)),
      realtime.on(EV.REVIEWED, (p) => {
        if (p.userId !== user?.id) return;
        if (p.status === 'approved') toast.success(`✅ Your memory “${p.title}” is now live`);
        else toast.error(`Your memory “${p.title}” was not published${p.reason ? `: ${p.reason}` : ''}`);
      }),
      realtime.on(EV.NEW, (p) => isAdmin && toast.info(`📥 New submission: ${p.title}`)),
      realtime.on(EV.DUPLICATE, (p) => isAdmin && toast.warn(`⚠️ Possible duplicate of “${p.of.title}”`)),
    ];
    return () => offs.forEach((o) => o());
  }, [user, isAdmin, toast]);
}

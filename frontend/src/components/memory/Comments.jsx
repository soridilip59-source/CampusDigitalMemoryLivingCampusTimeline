import { useState } from 'react';
import useAuth from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import * as memoryApi from '../../api/memoryApi';
import Avatar from '../common/Avatar';
import Button from '../common/Button';

export default function Comments({ memory, initial = [], onChange }) {
  const { user, isAdmin } = useAuth(); const toast = useToast(); const [comments, setComments] = useState(initial); const [text, setText] = useState('');
  const update = (next) => { setComments(next); onChange?.(next); };
  const submit = async (e) => { e.preventDefault(); if (!user) return toast.info('Log in to comment'); if (text.trim().length < 1 || text.trim().length > 300) return toast.error('Comment must be 1–300 characters'); try { const r = await memoryApi.addComment(memory.id, text); update(r.comments); setText(''); } catch (error) { toast.error(error.message); } };
  const remove = async (commentId) => { try { update(await memoryApi.deleteComment(memory.id, commentId)); } catch (error) { toast.error(error.message); } };
  return <section className="space-y-3 border-t border-slate-900/5 pt-4 dark:border-white/10"><h3 className="font-bold">Comments <span className="text-sm font-normal text-slate-500">{comments.length}</span></h3><form className="flex gap-2" onSubmit={submit}><input value={text} onChange={(e) => setText(e.target.value)} maxLength={300} aria-label="Write a comment" placeholder={user ? 'Add a comment…' : 'Log in to comment'} className="field min-w-0 flex-1"/><Button type="submit" disabled={!user || !text.trim()}>Post</Button></form><div className="max-h-56 space-y-2 overflow-y-auto">{comments.map((c) => <article key={c.id} className="flex gap-2 rounded-xl bg-slate-50 p-3 dark:bg-white/5"><Avatar name={c.userName}/><div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><b className="text-sm">{c.userName}</b>{(user?.id === c.userId || isAdmin) && <button onClick={() => remove(c.id)} aria-label="Delete comment" className="text-xs text-rose-600">Delete</button>}</div><p className="mt-1 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{c.text}</p></div></article>)}</div></section>;
}

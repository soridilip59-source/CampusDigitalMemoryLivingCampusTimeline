import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as memoryApi from '../api/memoryApi';
import MemoryCard from '../components/memory/MemoryCard';
import Avatar from '../components/common/Avatar';
import { EmptyState, PageLoader } from '../components/common/Loader';
export default function Contributor() { const { id } = useParams(); const [profile, setProfile] = useState(null); useEffect(() => { memoryApi.getContributor(id).then(setProfile).catch(() => setProfile(false)); }, [id]); if (!profile) return profile === false ? <main className="p-12 text-center">Contributor not found.</main> : <PageLoader />; return <main className="mx-auto max-w-6xl px-4 py-10"><div className="flex items-center gap-4"><Avatar name={profile.name} size="h-16 w-16 text-xl" /><div><h1 className="text-3xl font-extrabold">{profile.name}</h1><p className="text-slate-500">{profile.batch} · {profile.memories.length} memories · {profile.totalLikes} likes</p></div></div><div className="mt-4 flex flex-wrap gap-2">{profile.badges.map((b) => <span className="chip" key={b}>🏅 {b}</span>)}</div><div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{profile.memories.map((m) => <MemoryCard key={m.id} memory={m} />)}</div>{!profile.memories.length && <EmptyState title="No published memories yet" />}</main>; }

import { useRef, useState } from 'react';
import Icon from '../common/Icon';
import { compressImage } from '../../utils/compressImage';
import { MAX_IMAGES } from '../../utils/constants';

export default function ImageUploader({ value = [], onChange, error }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const add = async (fileList) => {
    setMsg('');
    const files = [...fileList].slice(0, MAX_IMAGES - value.length);
    if (!files.length) return setMsg(`You can add up to ${MAX_IMAGES} photos.`);
    setBusy(true);
    try {
      const out = [];
      for (const f of files) {
        if (!f.type.startsWith('image/')) { setMsg('Only photos (JPG, PNG, WebP) are allowed.'); continue; }
        if (f.size > 15 * 1024 * 1024) { setMsg('Each photo must be under 15 MB.'); continue; }
        out.push(await compressImage(f));
      }
      if (out.length) onChange([...value, ...out]);
    } catch (e) { setMsg(e.message); }
    setBusy(false);
  };

  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold">Photos <span className="font-normal text-slate-500">({value.length}/{MAX_IMAGES})</span></label>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); add(e.dataTransfer.files); }}
        className={`rounded-2xl border-2 border-dashed p-4 transition ${error ? 'border-rose-400' : 'border-slate-300 dark:border-white/15'}`}
      >
        {value.length > 0 && (
          <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {value.map((src, i) => (
              <div key={i} className="group relative aspect-square overflow-hidden rounded-xl">
                <img src={src} alt={`Upload ${i + 1}`} className="h-full w-full object-cover" />
                {i === 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">Cover</span>}
                <button type="button" onClick={() => onChange(value.filter((_, k) => k !== i))} aria-label="Remove photo" className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                  <Icon name="x" className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        <button type="button" disabled={busy || value.length >= MAX_IMAGES} onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center gap-1 rounded-xl py-4 text-sm text-slate-500 transition hover:bg-brand-50 hover:text-brand-700 disabled:opacity-50 dark:hover:bg-white/5">
          <Icon name="upload" className="h-6 w-6" />
          <span className="font-semibold">{busy ? 'Optimising photos…' : 'Drop photos here or tap to choose'}</span>
          <span className="text-xs">Photos are resized in your browser so uploads stay fast.</span>
        </button>
        <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => { add(e.target.files); e.target.value = ''; }} />
      </div>
      {(msg || error) && <p className="mt-1 text-xs font-medium text-rose-500">{msg || error}</p>}
    </div>
  );
}

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import useAuth from '../../hooks/useAuth';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import { GOOGLE_LOGIN_ENABLED } from '../../utils/constants';

const DEMO = [
  { label: 'Student demo', email: 'student@campus.com', password: 'student123' },
  { label: 'Admin demo', email: 'admin@campus.com', password: 'admin123' },
];

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const from = useLocation().state?.from?.pathname || '/';
  const toast = useToast();
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const handleGoogleSuccess = async ({ credential }) => {
    if (!credential) {
      setErr('Google did not return a sign-in credential. Please try again.');
      return;
    }

    setBusy(true);
    setErr('');
    try {
      const u = await loginWithGoogle(credential);
      toast.success(`Welcome, ${u.name.split(' ')[0]}`);
      navigate(from, { replace: true });
    } catch (ex) {
      setErr(ex.message);
      setBusy(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!f.email.includes('@') || f.password.length < 6) return setErr('Enter a valid email and a password of at least 6 characters.');
    setBusy(true); setErr('');
    try { const u = await login(f); toast.success(`Welcome back, ${u.name.split(' ')[0]}`); navigate(from, { replace: true }); }
    catch (ex) { setErr(ex.message); setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div>
        <h1 className="text-3xl font-extrabold">Log in</h1>
        <p className="mt-1 text-slate-500">Pick up where your batch left off.</p>
      </div>
      <Input label="Email" type="email" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      <Input label="Password" type="password" autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
      {err && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600 dark:bg-rose-500/10" role="alert">{err}</p>}
      <Button type="submit" size="lg" loading={busy} className="w-full">Log in</Button>

      {GOOGLE_LOGIN_ENABLED && (
        <>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
            or continue with
            <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
          </div>
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setErr('Google sign-in failed. Please try again.')}
              useOneTap={false}
              text="continue_with"
              width="384"
            />
          </div>
        </>
      )}

      <div className="rounded-xl bg-brand-50 p-4 text-sm dark:bg-brand-500/10">
        <p className="font-semibold">Trying it out? Fill in a demo account:</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {DEMO.map((d) => <button type="button" key={d.email} className="chip bg-white dark:bg-white/5" onClick={() => setF({ email: d.email, password: d.password })}>{d.label}</button>)}
        </div>
      </div>
      <p className="text-center text-sm text-slate-500">New here? <Link to="/register" className="font-semibold text-brand-600 hover:underline">Create an account</Link></p>
    </form>
  );
}

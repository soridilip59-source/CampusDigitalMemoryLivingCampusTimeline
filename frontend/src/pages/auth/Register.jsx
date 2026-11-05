import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { BATCHES, CURRENT_YEAR } from '../../utils/constants';
import { useToast } from '../../context/ToastContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [f, setF] = useState({ name: '', email: '', password: '', batch: `Batch ${CURRENT_YEAR}` });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const v = {};
    if (f.name.trim().length < 2) v.name = 'Enter your full name.';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) v.email = 'Enter a valid email.';
    if (f.password.length < 6) v.password = 'Use at least 6 characters.';
    setErrors(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    try { await register(f); toast.success('Account created. Add your first memory!'); navigate('/submit', { replace: true }); }
    catch (ex) { setErrors({ form: ex.message }); setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div>
        <h1 className="text-3xl font-extrabold">Join the archive</h1>
        <p className="mt-1 text-slate-500">Create an account to contribute memories.</p>
      </div>
      <Input label="Full name" autoComplete="name" value={f.name} onChange={set('name')} error={errors.name} />
      <Input label="Email" type="email" autoComplete="email" value={f.email} onChange={set('email')} error={errors.email} />
      <Input label="Password" type="password" autoComplete="new-password" value={f.password} onChange={set('password')} error={errors.password} />
      <Input as="select" label="Your batch" value={f.batch} onChange={set('batch')}>{BATCHES.map((b) => <option key={b}>{b}</option>)}</Input>
      {errors.form && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600 dark:bg-rose-500/10" role="alert">{errors.form}</p>}
      <Button type="submit" size="lg" loading={busy} className="w-full">Create account</Button>
      <p className="text-center text-sm text-slate-500">Already a member? <Link to="/login" className="font-semibold text-brand-600 hover:underline">Log in</Link></p>
    </form>
  );
}

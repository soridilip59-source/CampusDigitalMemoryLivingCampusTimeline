import { Link } from 'react-router-dom';
import Button from '../components/common/Button';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="year-outline font-display text-[8rem] font-extrabold leading-none text-brand-600 dark:text-brand-400">404</p>
      <h1 className="text-2xl font-bold">This page is not in the archive</h1>
      <p className="text-slate-500">The link may be old, or the memory was never published.</p>
      <Button as={Link} to="/">Back to the timeline</Button>
    </div>
  );
}

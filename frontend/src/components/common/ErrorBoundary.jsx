import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('App crashed:', error, info?.componentStack); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="text-5xl">🧯</div>
        <h1 className="text-2xl font-bold">Something broke on this page</h1>
        <p className="max-w-xl break-words rounded-lg bg-rose-50 px-4 py-3 font-mono text-sm text-rose-700">
          {String(this.state.error?.message || this.state.error)}
        </p>
        <button onClick={() => location.reload()} className="rounded-xl bg-brand-600 px-5 py-2.5 font-semibold text-white">Reload</button>
      </div>
    );
  }
}
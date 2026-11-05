import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="text-5xl">🧯</div>
        <h1 className="text-2xl font-bold">Something broke on this page</h1>
        <p className="text-slate-500">Reload to continue. Your saved memories are safe.</p>
        <button onClick={() => location.reload()} className="rounded-xl bg-brand-600 px-5 py-2.5 font-semibold text-white">Reload</button>
      </div>
    );
  }
}

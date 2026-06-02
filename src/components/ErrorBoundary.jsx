import React from 'react';

/**
 * Catches any render-time JavaScript error in the component tree below it.
 * Without this, a single bad API row (e.g. .map on undefined) white-screens the whole app.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-black text-white flex flex-col items-center justify-center gap-6 px-8 text-center">
          <div className="text-6xl">⚠️</div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Something went wrong</h1>
          <p className="text-white/40 text-sm max-w-md">
            An unexpected error occurred. This has been logged. Please refresh the page to continue.
          </p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
            className="bg-white text-black px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:bg-zinc-200 transition"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

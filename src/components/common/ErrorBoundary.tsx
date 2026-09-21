import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('SPECTRA Uncaught App Error:', error, errorInfo);
  }

  private handleReset = () => {
    // Do NOT clear localStorage here — that would destroy the active login session
    // and force the user back to the login screen in a reset loop.
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0F0912] text-slate-100 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold font-marcellus text-slate-100 mb-2">Application Notice</h1>
          <p className="text-sm text-slate-300 max-w-md mb-6 leading-relaxed">
            The application encountered a display refresh. Tap the button below to return directly to the workspace.
          </p>
          <button
            onClick={this.handleReset}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-rose-950/40 transition-all active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reload &amp; Reset Workspace</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

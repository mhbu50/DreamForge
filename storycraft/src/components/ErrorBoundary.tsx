import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      let errorDetails = null;
      try {
        if (this.state.error?.message) {
          errorDetails = JSON.parse(this.state.error.message);
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen bg-night flex items-center justify-center p-6">
          <div className="atmosphere opacity-20" />
          <div className="max-w-xl w-full glass-surface p-12 rounded-[2.5rem] border-white/10 text-center space-y-8 relative z-10">
            <div className="w-20 h-20 bg-red-500/20 rounded-3xl flex items-center justify-center text-red-500 mx-auto animate-pulse">
              <AlertTriangle size={40} />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-3xl font-serif font-bold text-white">System Anomaly Detected</h1>
              <p className="text-white/60 leading-relaxed">
                The App Architect encountered an unexpected disruption in the creative flow. 
                {errorDetails?.error ? ` Details: ${errorDetails.error}` : ' Our team has been notified.'}
              </p>
            </div>

            {errorDetails && (
              <div className="p-4 bg-black/40 rounded-2xl border border-white/5 text-left">
                <p className="text-[10px] uppercase tracking-widest text-white/20 font-bold mb-2">Technical Insight</p>
                <div className="grid grid-cols-2 gap-4 text-[10px] font-mono text-white/40">
                  <div>Operation: {errorDetails.operationType}</div>
                  <div>Path: {errorDetails.path || 'N/A'}</div>
                  <div className="col-span-2 truncate">Error: {errorDetails.error}</div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={this.handleReset}
                className="flex-1 py-4 bg-gold text-night font-bold rounded-xl hover:bg-gold/90 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCcw size={18} />
                <span>Retry Forge</span>
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="flex-1 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                <Home size={18} />
                <span>Return Home</span>
              </button>
            </div>

            <div className="pt-8 border-t border-white/5">
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/20 font-bold">Error Code: {errorDetails?.operationType || 'RUNTIME_EXCEPTION'}</p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

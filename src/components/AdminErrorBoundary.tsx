import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface State { hasError: boolean; error: Error | null; }

export class AdminErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[AdminErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex items-center justify-center p-8 min-h-[60vh]">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Terjadi Kesalahan</h2>
            <p className="text-sm text-muted-foreground mb-2">
              Halaman ini mengalami error. Dashboard tetap bisa diakses.
            </p>
            {this.state.error && (
              <div className="bg-muted/50 border border-border rounded-lg p-3 mb-5 text-left">
                <p className="text-xs font-mono text-destructive break-all">{this.state.error.message}</p>
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => this.setState({ hasError: false, error: null })} className="gap-2">
                <RefreshCw className="w-4 h-4" /> Coba Lagi
              </Button>
              <Button onClick={() => { window.location.href = '/admin'; }} className="gap-2 gradient-button text-primary-foreground">
                <Home className="w-4 h-4" /> Ke Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

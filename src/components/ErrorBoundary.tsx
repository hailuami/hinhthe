import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#0f0c15] text-white">
          <div className="glass-panel p-8 rounded-3xl max-w-md w-full space-y-4 text-center">
            <h2 className="text-xl font-black text-red-400">Đã có lỗi xảy ra</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ứng dụng gặp sự cố không mong muốn. Vui lòng thử tải lại trang.
            </p>
            <pre className="p-4 bg-black/40 rounded-xl text-[10px] text-left overflow-auto max-h-40 text-slate-500">
              {this.state.error?.message}
            </pre>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 btn-primary-gradient rounded-xl text-[10px] font-black uppercase tracking-widest"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturou um erro:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[280px] w-full flex items-center justify-center p-6 bg-amber-50/50 rounded-2xl border border-amber-200/80 my-4 text-center">
          <div className="max-w-md flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-xs">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-base font-bold text-gray-900">
              {this.props.fallbackTitle || 'Ocorreu um imprevisto temporário'}
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              {this.props.fallbackMessage || 
                'Não se preocupe: seus dados estão salvos. Você pode tentar novamente ou recarregar a visualização.'}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2 bg-[#865d39] text-white text-xs font-bold rounded-xl hover:bg-[#6f4b2b] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <RotateCcw size={14} />
                Tentar Novamente
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="px-4 py-2 bg-white text-gray-700 border border-gray-300 text-xs font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm cursor-pointer"
              >
                Recarregar Página
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

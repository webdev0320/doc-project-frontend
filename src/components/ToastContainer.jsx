import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import useToastStore from '../store/toastStore'

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl animate-in slide-in-from-right-10 duration-300
            ${toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : ''}
            ${toast.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : ''}
            ${toast.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' : ''}
            ${toast.type === 'info' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : ''}
          `}
        >
          <div className="shrink-0">
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5" />}
            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
            {toast.type === 'info' && <Info className="w-5 h-5" />}
          </div>
          <p className="text-sm font-medium pr-4">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-auto p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}

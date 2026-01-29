"use client"

import * as React from "react"

export interface ToastData {
  id: string
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

const ToastContext = React.createContext<{
  toasts: ToastData[]
  toast: (props: Omit<ToastData, "id">) => void
  dismiss: (id: string) => void
}>({
  toasts: [],
  toast: () => {},
  dismiss: () => {},
})

export const useToast = () => {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastData[]>([])

  const toast = React.useCallback((props: Omit<ToastData, "id">) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { ...props, id }])
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
      dismiss(id)
    }, 5000)
  }, [])

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  )
}

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-lg border p-4 shadow-lg min-w-[300px] max-w-md ${
            toast.variant === 'destructive'
              ? 'bg-red-50 border-red-200 text-red-900'
              : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              {toast.title && (
                <h3 className="font-semibold text-sm">{toast.title}</h3>
              )}
              {toast.description && (
                <p className="text-sm mt-1">{toast.description}</p>
              )}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
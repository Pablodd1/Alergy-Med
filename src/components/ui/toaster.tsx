'use client'

import * as React from 'react'
import { ToastProvider, useToast } from './use-toast'

export function Toaster() {
  let toasts: any[] = []
  let dismiss = (id: string) => {}
  
  try {
    const toastContext = useToast()
    toasts = toastContext.toasts
    dismiss = toastContext.dismiss
  } catch (error) {
    // If useToast fails, it means we're not inside a ToastProvider
    // Return an empty toaster to prevent crashes
    console.warn('Toaster: useToast not available, rendering empty toaster')
    return null
  }

  if (!toasts || toasts.length === 0) {
    return null
  }

  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`p-4 rounded-lg shadow-lg border ${
            toast.variant === 'destructive'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-white border-gray-200 text-gray-800'
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
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
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/ui/use-toast'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: 'Roman Super Allergist Assistant | Advanced Clinical AI',
  description: 'The world\'s most advanced AI-powered assistant for allergists and immunologists. Roman Super Allergist Assistant generates comprehensive SOAP notes, extracts clinical insights, and provides decision support based on global standards.',
  keywords: ['allergy', 'roman allergist', 'super assistant', 'soap note', 'medical documentation', 'icd-10', 'cpt codes', 'allergist', 'clinical notes'],
  authors: [{ name: 'Roman AI Systems' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0f172a',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={`${inter.className} antialiased selection:bg-blue-100 selection:text-blue-900`}>
        <ToastProvider>
          {children}
          <Toaster />
        </ToastProvider>
      </body>
    </html>
  )
}
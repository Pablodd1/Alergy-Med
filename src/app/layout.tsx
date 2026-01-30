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
  title: 'Allergy Scribe | AI Clinical Documentation',
  description: 'Professional AI-powered medical note generation for allergists and internal medicine providers. Generate SOAP notes, extract ICD-10 and CPT codes, and identify clinical red flags.',
  keywords: ['allergy', 'soap note', 'medical documentation', 'icd-10', 'cpt codes', 'allergist', 'clinical notes'],
  authors: [{ name: 'Allergy Scribe' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#2563eb',
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
      <body className={`${inter.className} antialiased`}>
        <ToastProvider>
          {children}
          <Toaster />
        </ToastProvider>
      </body>
    </html>
  )
}
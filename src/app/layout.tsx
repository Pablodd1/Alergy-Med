import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/ui/use-toast'
import { SessionProvider } from '@/components/providers/session-provider'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Allergy Scribe (Personal)',
  description: 'Comprehensive allergist medical note generation for single-user clinical documentation',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  console.log('Fetching session in RootLayout')
  const session = await getServerSession(authOptions)
  console.log('Session fetch result:', session ? 'User logged in' : 'No session')

  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider session={session}>
          <ToastProvider>
            {children}
            <Toaster />
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
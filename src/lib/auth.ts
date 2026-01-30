import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { UserService } from '@/services/userService'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        // Try to validate against database
        const user = await UserService.validatePassword(credentials.username, credentials.password)

        if (user) {
          return {
            id: user._id.toString(),
            username: user.username,
          }
        }

        // Fallback to environment variables if database check fails
        const defaultUsername = process.env.DEFAULT_USERNAME || 'allergist';
        const defaultPassword = process.env.DEFAULT_PASSWORD || 'allergy123';

        if (credentials.username === defaultUsername && credentials.password === defaultPassword) {
          return {
            id: 'default-admin',
            username: defaultUsername,
          }
        }

        return null
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.username = user.username
      }
      return token
    },
    async session({ session, token }: any) {
      if (token) {
        session.user = {
          id: token.sub!,
          username: token.username as string,
        }
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-key-change-in-production',
}
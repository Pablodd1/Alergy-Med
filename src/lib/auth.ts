import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

const users = [
  {
    id: '1',
    username: process.env.DEFAULT_USERNAME || 'allergist',
    password: bcrypt.hashSync(process.env.DEFAULT_PASSWORD || 'allergy123', 10),
  }
]

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

        const user = users.find(u => u.username === credentials.username)
        
        if (user && bcrypt.compareSync(credentials.password, user.password)) {
          return {
            id: user.id,
            username: user.username,
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
  }
}
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Fleet Credentials",
      credentials: {
        name: { label: "Name", type: "text", placeholder: "Fleet Officer" },
        email: { label: "Email", type: "email", placeholder: "operator@autoscan.ai" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Support both login and new sign-up registration
        const email = credentials?.email || "inspector@autoscan.ai";
        const customName = credentials?.name?.trim();
        const fallbackName = email.split("@")[0].replace(/[\._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        const name = customName || fallbackName;
        return {
          id: "user-" + Math.random().toString(36).substring(2, 9),
          name: name || "Fleet Operator",
          email: email,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET || "anpr-car-scanner-secret-fallback-key",
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id || token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
};


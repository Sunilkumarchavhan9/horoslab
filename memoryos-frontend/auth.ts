import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import LinkedIn from "next-auth/providers/linkedin";
import Credentials from "next-auth/providers/credentials";
import { sendEarlyAccessConfirmationEmail } from "@/lib/email-service";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID || process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.AUTH_GITHUB_SECRET || process.env.GITHUB_CLIENT_SECRET || "",
    }),
    LinkedIn({
      clientId: process.env.AUTH_LINKEDIN_ID || process.env.LINKEDIN_CLIENT_ID || "",
      clientSecret: process.env.AUTH_LINKEDIN_SECRET || process.env.LINKEDIN_CLIENT_SECRET || "",
    }),
    Credentials({
      name: "Early Access",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        if (!credentials?.email || typeof credentials.email !== "string") {
          return null;
        }
        const email = credentials.email.trim().toLowerCase();
        return {
          id: email,
          email,
          name: email.split("@")[0],
        };
      },
    }),
  ],
  pages: {
    signIn: "/",
    error: "/",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (user?.email) {
        try {
          await sendEarlyAccessConfirmationEmail({
            email: user.email,
            name: user.name || undefined,
            provider: account?.provider || "next-auth",
          });
        } catch (err) {
          console.warn("[NextAuth] Non-fatal confirmation email error:", err);
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user && token?.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "horos-auth-secret-session-key-32chars-min!!",
  trustHost: true,
});


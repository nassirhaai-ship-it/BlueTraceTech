import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import clientPromise from "./mongodb";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "jsmith@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log("[AUTH] ❌ Credentials manquantes");
            return null;
          }

          const client = await clientPromise;
          const db = client.db();
          // Normaliser l'email (trim et lowercase)
          const normalizedEmail = credentials.email.trim().toLowerCase();
          
          // Chercher l'utilisateur avec l'email normalisé
          let user = await db.collection("users").findOne({ email: normalizedEmail });
          
          if (!user) {
            user = await db.collection("users").findOne({ 
              $or: [
                { email: credentials.email },
                { email: { $regex: new RegExp(`^${normalizedEmail}$`, "i") } }
              ]
            });
          }
          
          if (!user) {
            console.log(`[AUTH] ❌ Utilisateur non trouvé: ${credentials.email}`);
            return null;
          }

          // Vérifier si l'utilisateur est actif
          if (user.actif !== undefined && user.actif === false) {
            console.log(`[AUTH] ❌ Utilisateur inactif: ${credentials.email}`);
            return null;
          }

          // Vérifier le mot de passe hashé
          const isValid = await bcrypt.compare(credentials.password, user.password);
          
          if (!isValid) {
            console.log(`[AUTH] ❌ Mot de passe incorrect pour: ${credentials.email}`);
            return null;
          }

          // Retourner l'utilisateur (sans le mot de passe)
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email || normalizedEmail, 
            role: user.role || "user"
          };
        } catch (error) {
          console.error("[AUTH] ❌ Erreur lors de l'authentification:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt" as const,
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/auth/signin",
  },
  debug: process.env.NODE_ENV === "development",
};

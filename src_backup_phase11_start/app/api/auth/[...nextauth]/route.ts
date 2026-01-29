import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { ensureMember } from "@/lib/google-sheets";

export const authOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
    ],
    callbacks: {
        async signIn({ user }: any) {
            if (user?.email) {
                try {
                    await ensureMember({
                        email: user.email,
                        name: user.name || "Unknown",
                        image: user.image,
                    });
                } catch (e) {
                    console.error("Failed to register member (Non-fatal)", e);
                    return true;
                }
            }
            return true;
        },
        async session({ session, token }: any) {
            if (session?.user) {
                session.user.id = token.sub; // Google ID
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET || "secret",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

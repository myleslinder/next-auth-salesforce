import type { Profile } from "next-auth"
import type { Adapter } from "next-auth/adapters"

// type out what the expected config object is
// create the objects for the schema and type those?
// write simple functions 

type prisma = Adapter<
  Prisma.PrismaClient,
  never,
  Prisma.User,
  Profile & { emailVerified?: Date },
  Prisma.Session
>

export const SalesforceAdapter = (something) => {
  return {
    async getAdapter({ session, secret, ...appOptions }) {
      return {
        displayName: "SALESFORCE",
        createUser(profile) {
          
          return prisma.user.create({
            data: {
              name: profile.name,
              email: profile.email,
              image: profile.image,
              emailVerified: profile.emailVerified?.toISOString() ?? null,
            },
          })
        },

        getUser(id) {
          return prisma.user.findUnique({
            where: { id },
          })
        },

        getUserByEmail(email) {
          if (!email) return Promise.resolve(null)
          return prisma.user.findUnique({ where: { email } })
        },

        async getUserByProviderAccountId(providerId, providerAccountId) {
          const account = await prisma.account.findUnique({
            where: {
              providerId_providerAccountId: { providerId, providerAccountId },
            },
            select: { user: true },
          })
          return account?.user ?? null
        },

        updateUser(user) {
          return prisma.user.update({
            where: { id: user.id },
            data: {
              name: user.name,
              email: user.email,
              image: user.image,
              emailVerified: user.emailVerified?.toISOString() ?? null,
            },
          })
        },

        async deleteUser(userId) {
          await prisma.user.delete({
            where: { id: userId },
          })
        },

        async linkAccount(
          userId,
          providerId,
          providerType,
          providerAccountId,
          refreshToken,
          accessToken,
          accessTokenExpires
        ) {
          await prisma.account.create({
            data: {
              userId,
              providerId,
              providerType,
              providerAccountId,
              refreshToken,
              accessToken,
              accessTokenExpires,
            },
          })
        },

        async unlinkAccount(_, providerId, providerAccountId) {
          await prisma.account.delete({
            where: {
              providerId_providerAccountId: { providerId, providerAccountId },
            },
          })
        },

        createSession(user) {
          return prisma.session.create({
            data: {
              userId: user.id,
              expires: new Date(Date.now() + sessionMaxAge),
              sessionToken: randomBytes(32).toString("hex"),
              accessToken: randomBytes(32).toString("hex"),
            },
          })
        },

        async getSession(sessionToken) {
          const session = await prisma.session.findUnique({
            where: { sessionToken },
          })
          if (session && session.expires < new Date()) {
            await prisma.session.delete({ where: { sessionToken } })
            return null
          }
          return session
        },

        async updateSession(session, force) {
          if (
            !force &&
            Number(session.expires) - sessionMaxAge + sessionUpdateAge >
              Date.now()
          ) {
            return null
          }
          return await prisma.session.update({
            where: { id: session.id },
            data: {
              expires: new Date(Date.now() + sessionMaxAge),
            },
          })
        },

        async deleteSession(sessionToken) {
          await prisma.session.delete({ where: { sessionToken } })
        },

        async createVerificationRequest(identifier, url, token, _, provider) {
          await prisma.verificationRequest.create({
            data: {
              identifier,
              token: hashToken(token),
              expires: new Date(Date.now() + provider.maxAge * 1000),
            },
          })
          await provider.sendVerificationRequest({
            identifier,
            url,
            token,
            baseUrl: appOptions.baseUrl,
            provider,
          })
        },

        async getVerificationRequest(identifier, token) {
          const hashedToken = hashToken(token)
          const verificationRequest =
            await prisma.verificationRequest.findUnique({
              where: { identifier_token: { identifier, token: hashedToken } },
            })
          if (verificationRequest && verificationRequest.expires < new Date()) {
            await prisma.verificationRequest.delete({
              where: { identifier_token: { identifier, token: hashedToken } },
            })
            return null
          }
          return verificationRequest
        },

        async deleteVerificationRequest(identifier, token) {
          await prisma.verificationRequest.delete({
            where: {
              identifier_token: { identifier, token: hashToken(token) },
            },
          })
        },
      }
    },
  }
}
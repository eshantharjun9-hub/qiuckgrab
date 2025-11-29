import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

const createPrismaClient = () =>
  new PrismaClient().$extends(withAccelerate());

// ❗ Fix: global type must be loose, not PrismaClient-specific
const globalForPrisma = globalThis as any;

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

// ❗ In development, store the client globally (to avoid hot-reload issues)
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;

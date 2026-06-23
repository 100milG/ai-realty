import { PrismaClient } from "@prisma/client";

// Re-use a single database connection client instance across our entire server.
// In development, we attach it to the global object to prevent hot-reloading from creating duplicate connections.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

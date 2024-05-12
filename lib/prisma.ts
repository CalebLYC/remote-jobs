import { PrismaClient } from "@prisma/client/extension";

export const prisma: PrismaClient =
    // @ts-ignore
    global.prisma ?? new PrismaClient({
        log: process.env.NODE_ENV === "production" ? ["error"] : ["query", "info", "warn", "error"],
    });

if (process.env.NODE_ENV !== "production") {
    // @ts-ignore
    global.prisma = prisma;
}
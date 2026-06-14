import { PrismaClient } from '../generated/prisma' 
import { PrismaNeon } from '@prisma/adapter-neon'
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not defined');

// Prepare the connection string and the neon adapter
const connectionString = process.env.DATABASE_URL
const adapter = new PrismaNeon({ connectionString });

// Create a typed container so typescript can understand
// what "global" will look like
const globalForDb = global as unknown as { db: PrismaClient }

// Check global for the db instance. If it dosen't exist
// create a brand new prisma client instance using the neon adapter
const db = globalForDb.db || new PrismaClient({ adapter })

// If this directory is in production, store the prisma client
// instance in the global container
if (process.env.NODE_ENV !== "production") globalForDb.db = db

export { db }
export * from "../generated/prisma"
export * from "./utils"
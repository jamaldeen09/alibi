"use server"
import { db, Prisma } from "@alibi/database"
import { ServerAction } from "@alibi/types"
import { auth, clerkClient } from "@clerk/nextjs/server"

export const deleteAccount: ServerAction = async () => {
    const { isAuthenticated, userId } = await auth()

    // Route Guard: Ensure the user is logged in
    if (!isAuthenticated || !userId) return ({
        success: false,
        message: "No active session found. Please sign in and try again",
    })

    try {
        // Initialize the backend client
        const client = await clerkClient()

        try {
            await client.users.deleteUser(userId);
        } catch (clerkError) {
            console.error("Clerk API deletion failed:", clerkError);
            return ({
                success: false,
                message: "We couldn't verify account removal with our auth provider. Please try again later"
            })
        }

        // Trigger the account deletion in our own database
        try {
            await db.user.delete({ where: { id: userId }, select: { id: true } });
        } catch (e) {
            // Ignore if the webhook somehow beat us to it
            if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025')) 
                throw e;
        }

        return ({
            success: true,
            message: "Your account has been permanently deleted"
        })
    } catch (error) {
        return ({
            success: false,
            message: "Account deletion failed, Please try again later"
        })
    }
}
"use server";
import { usernameSchema } from "@/lib/validations/usernameSchema";
import { db } from "@alibi/database";
import { ServerAction } from "@alibi/types";
import { auth, clerkClient } from "@clerk/nextjs/server";

type TError = {validationError: { username: string; issues: string[] }};
export const completeOnboarding: ServerAction<{ formData: FormData }, any, TError> = async ({ formData }) => {
    const { userId, isAuthenticated } = await auth();
    const client = await clerkClient();

    // Handle cases where the user is unauthenticated
    if (!isAuthenticated || !userId) return ({
        success: false,
        message: "No active session found. Please sign in and try again",
    });


    // Extract the expected username from the formData
    const username = formData.get("username") as string | null | undefined;

    // Validate the provided username
    const result = usernameSchema.safeParse(username);
    if (!result.success) {
        const firstErrorMessage = result.error.issues[0]?.message || "Invalid username.";
        return {
            success: false,
            message: "Invalid username, Please make sure your username passes all the requirements",
            error: {
                validationError: {
                    username: firstErrorMessage,
                    issues: result.error.issues.map(issue => issue.message)
                }
            }
        };
    };

    try {
        const validatedUsername = username as string;

        // Ensure username isn't a duplicate in your own DB
        const existingUser = await db.user.findUnique({
            where: { username: validatedUsername },
            select: { id: true }
        });
        
        if (existingUser) {
            return {
                success: false,
                message: "This username is already taken, Please choose another username",
                error: {
                    validationError: {
                        username: "This username is already taken.",
                        issues: ["This username is already taken."]
                    }
                }
            };
        }

        // After validation check if the user already
        await db.user.update({ 
            where: { id: userId },
            data: { username },
        });

        // Update Clerk: Mutate publicMetadata to complete the onboarding check
        await client.users.updateUser(userId, {
            publicMetadata: { onboardingComplete: true },
        });

        return ({
            success: true,
            message: "Onboarding completed successfully",
        });
    } catch (err) {
        console.error("Onboarding server action error:", err);
        return ({
            success: false,
            message: "An unexpected database or server error occurred. Please try again shortly",
        });
    }
}
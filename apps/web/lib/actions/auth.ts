"use server"
import { ServerAction } from "@alibi/types";
import bcrypt from "bcrypt"
import z from "zod";
import { authSchema } from "../validations/usernameSchema";
import { db } from "@alibi/database";
import { createRateLimit } from "@/config/rate-limiting";
import { headers } from "next/headers";
import { formatRateLimitReset } from "../utils";

const authRateLimit = createRateLimit({
    requests: 10,
    window: "1m",
    prefix: "auth"
});

export const signUp: ServerAction<{ formData: FormData }, unknown, {
    validationError?: z.core.$ZodFormattedError<{
        email: string;
        password: string;
    }, string>,
    resetsIn?: number;
}> = async ({ formData }) => {
    try {

        // Extract the requesting client's ip address (For ratelimiting)
        const headerList = await headers()
        const ip = headerList.get("x-forwarded-for");

        // Confirm the IP address exists
        if (!ip) {
            return {
                success: false,
                message: "Unable to verify your request source. Please ensure your network settings allow sharing your IP address",
            };
        }

        // Rate limit check
        const { success, reset } = await authRateLimit.limit(ip);
        if (!success) {
            const waitTime = formatRateLimitReset(reset);
            return {
                success: false,
                message: `Too many sign up attempts from this location. Please wait ${waitTime} before trying again.`,
                error: { resetsIn: reset },
            };
        }

        // Extract the email address and password from the provided
        // formData
        const email = formData.get("email");
        const password = formData.get("password");

        // Validate the extracted email & password
        const result = authSchema.safeParse({ email, password });
        if (!result.success) {
            const formattedErrors = result.error.format();
            const errorMessages: string[] = [];

            if (formattedErrors.email?._errors?.length) {
                errorMessages.push(`Email: ${formattedErrors.email._errors.join(", ")}`);
            }
            if (formattedErrors.password?._errors?.length) {
                errorMessages.push(`Password: ${formattedErrors.password._errors.join(", ")}`);
            }

            const validationMessage = errorMessages.length
                ? `Please fix the following issues: ${errorMessages.join("; ")}.`
                : "Please check your email and password and try again.";

            return {
                success: false,
                message: validationMessage,
                error: { validationError: formattedErrors },
            };
        }

        // Check if a record with that email address already exists
        const user = await db.user.findUnique({
            where: { email: email as string },
            select: { id: true }
        });

        if (user) {
            return {
                success: false,
                message: "An account with this email already exists. Please log in instead",
            };
        };

        // Hash the new client's password
        let passwordHash: string | null = null;
        try {
            passwordHash = await bcrypt.hash(password as string, 12);
        } catch (hashError) {
            console.error("Password hashing failed:", hashError);
            return {
                success: false,
                message: "We couldn't secure your account due to a technical issue. Please try again later",
            };
        }


        // Save a new record in the database
        await db.user.create({
            data: {
                email: email as string,
                passwordHash
            },
            select: { id: true }
        });

        return {
            success: true,
            message: "Account created successfully!",
        };
    } catch (err) {
        console.error("Unexpected error during sign up:", err);
        return {
            success: false,
            message: "Something went wrong while creating your account. Please try again in a few moments",
        };
    }
};

export const logIn: ServerAction<{ formData: FormData }, unknown, {
    validationError?: z.core.$ZodFormattedError<{
        email: string;
        password: string;
    }, string>,
    resetsIn?: number;
}> = async ({ formData }) => {
    try {
        // Extract the requesting client's ip address (For ratelimiting)
        const headerList = await headers()
        const ip = headerList.get("x-forwarded-for");

        // Confirm the IP address exists
        if (!ip) {
            return {
                success: false,
                message: "Unable to verify your request source. Please ensure your network settings allow sharing your IP address",
            };
        }

        // Rate limit check
        const { success, reset } = await authRateLimit.limit(ip);
        if (!success) {
            const waitTime = formatRateLimitReset(reset);
            return {
                success: false,
                message: `Too many log in attempts from this location. Please wait ${waitTime} before trying again.`,
                error: { resetsIn: reset },
            };
        }

        // Extract the email address and password from the provided
        // formData
        const email = formData.get("email");
        const password = formData.get("password");

        // Validate the extracted email & password
        const result = authSchema.safeParse({ email, password });
        if (!result.success) {
            const formattedErrors = result.error.format();
            const errorMessages: string[] = [];

            if (formattedErrors.email?._errors?.length) {
                errorMessages.push(`Email: ${formattedErrors.email._errors.join(", ")}`);
            }
            if (formattedErrors.password?._errors?.length) {
                errorMessages.push(`Password: ${formattedErrors.password._errors.join(", ")}`);
            }

            const validationMessage = errorMessages.length
                ? `Please fix the following issues: ${errorMessages.join("; ")}.`
                : "Please check your email and password and try again.";

            return {
                success: false,
                message: validationMessage,
                error: { validationError: formattedErrors },
            };
        }

        // Check if a record with that email address exists
        const user = await db.user.findUnique({
            where: { email: email as string },
            select: {
                id: true,
                passwordHash: true,
                accounts: { select: { provider: true } }
            },
        });

        if (!user) {
            return {
                success: false,
                message: "Invalid email or password"
            }
        };

        // Check if the record was created via OAuth
        if (user.accounts && user.accounts.length > 0 && user.accounts[0]?.provider) {
            const providerName = user.accounts[0].provider.charAt(0).toUpperCase() + user.accounts[0].provider.slice(1);
            return {
                success: false,
                message: `This email is linked to a ${providerName} account. Please sign in using ${providerName} instead of a password.`,
            };
        }

        // If a record with that email does exist and it wasn't created
        // using OAuth verify the provided password
        const isValid = await bcrypt.compare(password as string, user.passwordHash ?? "");
        if (!isValid) {
            return {
                success: false,
                message: "Incorrect password. Please try again or reset your password if you've forgotten it",
            }
        }

        return {
            success: true,
            message: "Welcome back! You have successfully signed in",
        };
    } catch (err) {
        console.error("Unexpected error during sign up:", err);
        return {
            success: false,
            message: "Something went wrong while attemping to log you into your account. Please try again in a few moments",
        };
    }
}
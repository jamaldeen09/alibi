import { z } from "zod";

export const usernameSchema = z
    .string()
    .min(3, "Username must be at least 3 characters long.")
    .max(15, "Username cannot exceed 15 characters.")
    // Rule 1: Allowed Characters & Leading/Trailing Whitespace Check
    .regex(
        /^[a-zA-Z0-9_\-]+( [a-zA-Z0-9_\-]+)*$/,
        "Only letters, numbers, spaces, underscores, and hyphens are allowed. No leading or trailing spaces."
    )
    // Rule 2: No Consecutive Spaces
    .refine(
        (val) => !val.includes("  "),
        "Username cannot contain consecutive spaces."
    )
    // Rule 3: No Consecutive Underscores
    .refine(
        (val) => !val.includes("__"),
        "Username cannot contain consecutive underscores."
    );

"use client";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { completeOnboarding } from "./_actions";
import { SubmitEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { usernameSchema } from "@/lib/validations/usernameSchema";

export default function OnboardingComponent() {
    const { user } = useUser();
    const router = useRouter();
    const [completing, setCompleting] = useState(false);

    const validateUsername = (username: string | null) => {
        let trimmed: string | null = null
        if (username) trimmed = username.trim();

        const result = usernameSchema.safeParse(trimmed);
        return result.success
    }

    const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        setCompleting(true);
        const formData = new FormData(e.currentTarget);
        console.log("Form data:", formData)

        const isValidUsername = validateUsername(formData.get("username") as string | null);
        if (!isValidUsername) return alert("Username is invalid!");


        try {
            const result = await completeOnboarding({ formData });
            if (!result.success) {
                return alert(result.message);
            };

            await user?.reload();
            router.push("/home");
        } catch { alert("An error occured") } finally { setCompleting(false) }
    };
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center justify-center items-center flex gap-2 flex-col">
                <p className="text-lg font-semibold">Welcome to Alibi, Choose a username before proceeding</p>
                <form onSubmit={handleSubmit} className="flex items-start flex-col gap-2">
                    <label htmlFor="username">Username</label>
                    <div className="flex items-center gap-1.5">
                        <input
                            title="username"
                            placeholder="Enter a unique username"
                            className="border border-input px-3 py-2"
                            type="text"
                            name="username"
                        />

                        <Button type="submit" size="lg">{completing ? "Proceeding..." : "Proceed"}</Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

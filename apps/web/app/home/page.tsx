"use client"
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { deleteAccount } from "./_actions";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function HomePage() {
    const [deleting, setDeleting] = useState(false);
    const router = useRouter()
    const { user } = useUser();
    return (
        <div className="flex min-h-screen justify-center items-center">
            <div className="flex flex-col gap-4 items-center">
                <p className="text-xl">Home Page</p>
                <Link href="/">
                    <Button size="lg" variant="link">
                        <ArrowLeft />
                        Go back to landing page
                    </Button>
                </Link>


                <Button disabled={deleting} size="sm" onClick={async () => {
                    setDeleting(true);
                    try {
                        const res = await deleteAccount();
                        alert(res.message);
          
                        if (res.success) {
                            await user?.reload();
                            router.push("/");
                        }
                    } catch { alert("Failed to delete your account") } finally { setDeleting(false) }

                }}>{deleting ? "Deleting..." : "Delete account"}</Button>
            </div>
        </div>
    )
}
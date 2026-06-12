"use client"
import { Button } from "@/components/ui/button";
import { Show, SignInButton, SignUpButton } from "@clerk/nextjs";
import { ArrowRight } from "lucide-react"
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="flex flex-col gap-8">

        <div className="flex items-center gap-2 flex-col">
          <p className="text-lg font-semibold">Initial authentication</p>
          <div className="flex items-center gap-4">
            <Show when="signed-out">
              <SignUpButton mode="modal">
                <Button size="lg">Sign Up</Button>
              </SignUpButton>
            </Show>

            <Show when="signed-out">
              <SignInButton mode="modal">
                <Button size="lg">Sign In</Button>
              </SignInButton>
            </Show>

            <Show when="signed-in">
              <Link href="/home">
                <Button size="lg" variant="link">
                  Go To Home Page
                  <ArrowRight />
                </Button>
              </Link>
            </Show>
          </div>
        </div>
      </div>
    </div>
  )
}
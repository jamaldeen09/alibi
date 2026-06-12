import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
    "/",
    "/api/webhooks(.*)"
]);

export default clerkMiddleware(async (auth, req) => {
    const { userId, sessionClaims, redirectToSignIn } = await auth();

    // Guardrail: Protect private pages from unauthenticated guests
    if (!userId && !isPublicRoute(req)) return redirectToSignIn();

    // Gatekeeper: Force authenticated users to complete onboarding if metadata is missing
    if (
        userId &&
        !(sessionClaims?.metadata as { onboardingComplete?: boolean })?.onboardingComplete &&
        req.nextUrl.pathname !== "/onboarding"
    ) {
        const onboardingUrl = new URL("/onboarding", req.url);
        return NextResponse.redirect(onboardingUrl);
    }
    
    if (userId && !isPublicRoute(req)) return NextResponse.next();
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};

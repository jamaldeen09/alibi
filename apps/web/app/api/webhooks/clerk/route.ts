import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { db, Prisma } from '@alibi/database';

export async function POST(req: Request) {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
    if (!WEBHOOK_SECRET) throw new Error('Missing webhook secret');

    try {
        // Get the headers for Svix verification
        const headerPayload = await headers();
        const svix_id = headerPayload.get("svix-id");
        const svix_timestamp = headerPayload.get("svix-timestamp");
        const svix_signature = headerPayload.get("svix-signature");

        if (!svix_id || !svix_timestamp || !svix_signature) {
            return new Response('Error occured -- no svix headers', { status: 400 });
        }

        // Get the body
        const payload = await req.json();
        const body = JSON.stringify(payload);
        const wh = new Webhook(WEBHOOK_SECRET);
        let evt: WebhookEvent;

        // Verify the payload
        try {
            evt = wh.verify(body, {
                "svix-id": svix_id,
                "svix-timestamp": svix_timestamp,
                "svix-signature": svix_signature,
            }) as WebhookEvent;
        } catch (err) {
            return new Response('Error occured', { status: 400 });
        }

        // Handle the database synchronization
        const eventType = evt.type;

        if (eventType === "user.created") {
            const { id, email_addresses, image_url } = evt.data;

            // Find the primary email address safely
            const primaryEmail = email_addresses.find(
                (email) => email.id === evt.data.primary_email_address_id
            )?.email_address || email_addresses[0]?.email_address;

            await db.user.create({
                data: {
                    id: id,
                    email: primaryEmail,
                    avatarUrl: image_url,
                }
            });

            console.log("Successfully created user account!");
        }

        switch (evt.type) {
            case "user.created":
                const userCreationData = evt.data;

                // Find the primary email address safely
                const primaryEmail = userCreationData.email_addresses.find(
                    (email) => email.id === evt.data.primary_email_address_id
                )?.email_address || userCreationData.email_addresses[0]?.email_address;

                await db.user.create({
                    data: {
                        id: userCreationData.id,
                        email: primaryEmail,
                        avatarUrl: userCreationData.image_url,
                    }
                });

                break;

            case "user.deleted":
                const userDeletionData = evt.data;

                // Find and delete the record in our database
                try {
                    await db.user.delete({ where: { id: userDeletionData.id } });
                } catch (err) {
                    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025')
                        return new Response("User no longer exists in the database", { status: 200 })

                    return new Response("Database error", { status: 500 });
                }
        }

        return new Response("", { status: 200 });
    } catch (err) {
        console.error("CRITICAL /api/webhooks/clerk error:", err);
        return new Response((err as any)?.message ?? "A server error occured", { status: 400 });
    }
}

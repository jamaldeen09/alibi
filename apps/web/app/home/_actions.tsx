"use server"
import { db, Prisma, getPrismaErrMsg } from "@alibi/database"
import { ServerAction } from "@alibi/types"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { caseCreationAgent } from "@alibi/agents"

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
    } catch (err) {
        console.error("Account deletion failed:", err)
        return ({
            success: false,
            message: "Account deletion failed, Please try again later"
        })
    }
}


export const createCase: ServerAction = async () => {
    const { isAuthenticated, userId } = await auth()

    // Route Guard: Ensure the user is logged in
    if (!isAuthenticated || !userId) return ({
        success: false,
        message: "No active session found. Please sign in and try again",
    });

    try {
        const caseCreationAgentOutput = await caseCreationAgent.executeCaseCreationAgent({});
        if (!caseCreationAgentOutput.success && caseCreationAgentOutput.error) {
            return ({
                success: false,
                message: caseCreationAgentOutput.error!.message,
                error: caseCreationAgentOutput.error
            });
        };

        const data = caseCreationAgentOutput.data as {
            title: string;
            victimName: string;
            victimDetails: string;
            timeLimit: number;
            location: string;
            hiddenTruth: string;
            suspects: {
                name: string;
                motive: string;
                alibi: string;
                secret: string;
                isKiller: boolean;
            }[];

            evidence: {
                label: string;
                description: string;
            }[];

            witnesses: {
                name: string;
                statement: string;
            }[];
        };

        // Save the case to the database
        const createdCase = await db.case.create({
            data: {
                title: data.title,
                creatorId: userId,
                victimName: data.victimName,
                victimDetails: data.victimDetails,
                timeLimit: data.timeLimit,
                location: data.location,
                hiddenTruth: data.hiddenTruth,
                suspects: { createMany: { data: data.suspects } },
                evidence: { createMany: { data: data.evidence } },
                witnesses: {
                    create: data.witnesses.map((witness) => ({
                        name: witness.name,
                        statements: {
                            create: {
                                content: witness.statement,
                                isDeception: false,
                                isCurrent: true,
                            }
                        }
                    }))
                },
            },

            select: { id: true }
        });

        // Build a URL that leads to the case view page
        const url = `${process.env.NEXT_PUBLIC_APP_URL}/case/${createdCase.id}`
        return ({
            success: true,
            message: "A new case has been successfully created",
            data: {
                caseId: createdCase.id,
                caseUrl: url,
            }
        });
    } catch (err) {
        console.log("Case creation failed:", err);
        return ({
            success: false,
            message: getPrismaErrMsg(err),
        })
    }
}

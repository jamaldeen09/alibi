import { GenerateWithAI } from "@alibi/types";

const OPEN_ROUTER_API_KEY = process.env.OPEN_ROUTER_API_KEY_2;
if (!OPEN_ROUTER_API_KEY) throw new Error("Open router API key was not found");

interface GenerateWithOpenRouterArgs {
    messages: Array<{ role: "system" | "user", content: string }>;
    model?: string;
}

export const generateWithOpenRouter: GenerateWithAI<GenerateWithOpenRouterArgs> = async ({
    messages,
    model = "meta-llama/llama-3.2-3b-instruct:free",
}) => {
    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${OPEN_ROUTER_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model,
                messages
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            // Handle specific HTTP errors
            let code = "API_ERROR";
            let message = `OpenRouter request failed with status ${response.status}`;
            if (response.status === 429) {
                code = "RATE_LIMITED";
                message = "Rate limit exceeded. Please wait and try again";
            } else if (response.status === 503) {
                code = "SERVICE_UNAVAILABLE";
                message = "OpenRouter service is temporarily unavailable. Try again later";
            }

            return {
                success: false,
                error: {
                    message,
                    code,
                    status: response.status,
                    details: data,
                },
            };
        }

        // Extract content
        const content = data.choices?.[0]?.message?.content;
        if (!content) {
            return {
                success: false,
                error: {
                    message: "OpenRouter returned an empty response",
                    code: "EMPTY_RESPONSE",
                },
            };
        }

        try {
            const parsed = JSON.parse(content);
            return { success: true, data: parsed };
        } catch (parseError) {
            return {
                success: false,
                error: {
                    message: "Failed to parse LLM response as JSON.",
                    code: "PARSE_ERROR",
                    details: {
                        rawContent: content,
                        error: String(parseError)
                    },
                },
            };
        }
    } catch (networkError) {
        return {
            success: false,
            error: {
                message: "A network or unexpected error occured. Try again later",
                code: "NETWORK_ERROR",
                details: String(networkError),
            }
        }
    }
}
import { ContentListUnion, GoogleGenAI } from "@google/genai";
import { GenerateWithAI } from "@alibi/types"
export const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

interface GenerateWithGeminiArgs {
    contents: ContentListUnion;
    systemInstruction: string;
    schema?: object;
}

export const generateWithGemini: GenerateWithAI<GenerateWithGeminiArgs> = async ({
    systemInstruction,
    contents,
    schema = {}
}) => {
    const isSchema = schema !== undefined && Object.keys(schema).length > 0;

    try {
        const response = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents,
            config: {
                systemInstruction,
                responseMimeType: isSchema ? "application/json" : undefined,
                responseSchema: isSchema ? schema : undefined,
            }
        });

        if (!response || typeof response.text !== "string") {
            return {
                success: false,
                error: {
                    message: "Gemini returned an invalid response structure.",
                    code: "INVALID_RESPONSE",
                    details: response,
                },
            };
        }

        const rawText = response.text.trim();
        if (!rawText) {
            return {
                success: false,
                error: {
                    message: "Gemini returned an empty response",
                    code: "EMPTY_RESPONSE",
                },
            };
        }

        if (isSchema) {
            try {
                const parsed = JSON.parse(rawText);
                return { success: true, data: parsed };
            } catch (parseError) {
                return {
                    success: false,
                    error: {
                        message: "Gemini output did not match the expected JSON schema",
                        code: "SCHEMA_MISMATCH",
                        details: { rawText, parseError: String(parseError) },
                    },
                };
            }
        } else {
            return {
                success: true,
                data: rawText
            };
        }
    } catch (apiError: any) {
        let code = "API_ERROR";
        let message = "Gemini API request failed.";
        if (apiError.message?.includes("429")) {
            code = "RATE_LIMITED";
            message = "Gemini rate limit exceeded. Please wait.";
        } else if (apiError.message?.includes("403")) {
            code = "FORBIDDEN";
            message = "Gemini API key is invalid or lacks permissions.";
        } else if (apiError.message?.includes("500")) {
            code = "SERVER_ERROR";
            message = "Gemini service returned a server error.";
        }
        return {
            success: false,
            error: {
                message,
                code,
                details: apiError.message || String(apiError),
            },
        };
    }
}
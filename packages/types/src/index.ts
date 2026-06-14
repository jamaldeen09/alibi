export interface ServerActionPayload<TData = any, TError = any> {
    success: boolean;
    message: string;
    data?: TData;
    error?: TError
}

export type ServerAction<TArgs = void, TData = any, TError = any> =
    (args: TArgs) => Promise<ServerActionPayload<TData, TError>>

export type GenerateWithAI<TArgs = void, TData = unknown> = (args: TArgs) => Promise<{
    success: boolean;
    data?: TData;
    error?: {
        message: string;
        code: string;
        status?: number;
        details?: any;
    };
}>
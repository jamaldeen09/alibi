export interface ServerActionPayload<TData = any, TError = any> {
    success: boolean;
    message: string;
    data?: TData;
    error?: TError
}

export type ServerAction<TArgs = void, TData = any, TError = any> = 
(args: TArgs) => Promise<ServerActionPayload<TData, TError>>
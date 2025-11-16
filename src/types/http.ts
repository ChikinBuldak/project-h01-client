import { z } from "zod"


export type YourAverageHTTPResponse<T>  = {
    readonly statusCode: number,
    readonly message: string,
    readonly payload: T,
}

export type HTTPResponseError = {
    readonly statusCode: number,
    readonly message: string
}

export const YourAverageHttpResponseFactory = {
    new<T>(statusCode: number, message: string, payload: T): YourAverageHTTPResponse<T> {
        return {
            statusCode,
            message,
            payload
        }
    }
}

export const RestApiErrorSchema = z.object({
    code: z.number(),
    error: z.boolean(),
    message: z.string()
});

export type RestApiError = z.infer<typeof RestApiErrorSchema>
import type { Wretch } from 'wretch'
import type { ZodSchema, z } from 'zod'

type FreeformRecord = Record<string, unknown>

export type CommonRequestParams<ResponseBody> = {
	path: string
	responseBodySchema: ZodSchema<ResponseBody>
	isEmptyResponseExpected?: boolean // 204 is considered a success. Default is "false" for GET operations and "true" for everything else
	isNonJSONResponseExpected?: boolean // Do not throw an error if not receiving 'application/json' content-type.  Default is "false" for GET operations and "true" for everything else
}

export type BodyRequestParams<RequestBodySchema extends z.ZodSchema, ResponseBody> = {
	body: z.input<RequestBodySchema> | undefined
	requestBodySchema: RequestBodySchema | undefined
} & CommonRequestParams<ResponseBody>

export type FreeBodyRequestParams<ResponseBody> = {
	body?: FreeformRecord
	requestBodySchema?: never
} & CommonRequestParams<ResponseBody>

export type QueryParams<RequestQuerySchema extends z.ZodSchema, ResponseBody> = {
	queryParams: z.input<RequestQuerySchema> | undefined
	queryParamsSchema: RequestQuerySchema | undefined
} & CommonRequestParams<ResponseBody>

export type FreeQueryParams<ResponseBody> = {
	queryParams?: FreeformRecord
	queryParamsSchema?: never
} & CommonRequestParams<ResponseBody>

export type ResourceChangeParams<
	RequestBody,
	ResponseBody,
	RequestQuerySchema extends z.Schema | undefined = undefined,
> = (RequestBody extends z.Schema
	? BodyRequestParams<RequestBody, ResponseBody>
	: FreeBodyRequestParams<ResponseBody>) &
	(RequestQuerySchema extends z.Schema
		? QueryParams<RequestQuerySchema, ResponseBody>
		: FreeQueryParams<ResponseBody>)

// We don't know which addons Wretch will have, and we don't really care, hence any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WretchInstance = Wretch<any, unknown, undefined>

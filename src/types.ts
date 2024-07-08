import type { Wretch, WretchResponse } from 'wretch'
import type { ZodSchema, z } from 'zod'

type FreeformRecord = Record<string, unknown>

export type CommonRequestParams<ResponseBody, IsNonJSONResponseExpected extends boolean> = {
	path: string
	responseBodySchema: ZodSchema<ResponseBody>
	isEmptyResponseExpected?: boolean // 204 is considered a success. Default is "false" for GET operations and "true" for everything else
	isNonJSONResponseExpected?: IsNonJSONResponseExpected // Do not throw an error if not receiving 'application/json' content-type.  Default is "false" for GET operations and "true" for everything else
}

export type BodyRequestParams<
	RequestBodySchema extends z.ZodSchema,
	ResponseBody,
	IsNonJSONResponseExpected extends boolean,
> = {
	body: z.input<RequestBodySchema> | undefined
	requestBodySchema: RequestBodySchema | undefined
} & CommonRequestParams<ResponseBody, IsNonJSONResponseExpected>

export type FreeBodyRequestParams<ResponseBody, IsNonJSONResponseExpected extends boolean> = {
	body?: FreeformRecord
	requestBodySchema?: never
} & CommonRequestParams<ResponseBody, IsNonJSONResponseExpected>

export type QueryParams<
	RequestQuerySchema extends z.ZodSchema,
	ResponseBody,
	IsNonJSONResponseExpected extends boolean,
> = {
	queryParams: z.input<RequestQuerySchema> | undefined
	queryParamsSchema: RequestQuerySchema | undefined
} & CommonRequestParams<ResponseBody, IsNonJSONResponseExpected>

export type FreeQueryParams<ResponseBody, IsNonJSONResponseExpected extends boolean> = {
	queryParams?: FreeformRecord
	queryParamsSchema?: never
} & CommonRequestParams<ResponseBody, IsNonJSONResponseExpected>

export type DeleteParams<
	RequestQuerySchema extends z.ZodSchema,
	ResponseBody,
	IsNonJSONResponseExpected extends boolean,
> = {
	queryParams: z.input<RequestQuerySchema> | undefined
	queryParamsSchema: RequestQuerySchema | undefined
} & Omit<CommonRequestParams<ResponseBody, IsNonJSONResponseExpected>, 'responseBodySchema'> & {
		responseBodySchema?: ZodSchema<ResponseBody>
	}

export type FreeDeleteParams<ResponseBody, IsNonJSONResponseExpected extends boolean> = {
	queryParams?: FreeformRecord
	queryParamsSchema?: never
} & Omit<CommonRequestParams<ResponseBody, IsNonJSONResponseExpected>, 'responseBodySchema'> & {
		responseBodySchema?: ZodSchema<ResponseBody>
	}

export type RequestResultType<
	ResponseBody,
	isNonJSONResponseExpected extends boolean | undefined,
> = isNonJSONResponseExpected extends true ? WretchResponse | null : ResponseBody | null

export type ResourceChangeParams<
	RequestBody,
	ResponseBody,
	RequestQuerySchema extends z.Schema | undefined = undefined,
	IsNonJSONResponseExpected extends boolean = false,
> = (RequestBody extends z.Schema
	? BodyRequestParams<RequestBody, ResponseBody, IsNonJSONResponseExpected>
	: FreeBodyRequestParams<ResponseBody, IsNonJSONResponseExpected>) &
	(RequestQuerySchema extends z.Schema
		? QueryParams<RequestQuerySchema, ResponseBody, IsNonJSONResponseExpected>
		: FreeQueryParams<ResponseBody, IsNonJSONResponseExpected>)

// We don't know which addons Wretch will have, and we don't really care, hence any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WretchInstance = Wretch<any, unknown, undefined>

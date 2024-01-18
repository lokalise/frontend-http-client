import type { Wretch } from 'wretch'
import type { ZodSchema } from 'zod'

export type CommonRequestParams<ResponseBody> = {
	path: string
	responseBodySchema?: ZodSchema<ResponseBody>
}

export type BodyRequestParams<RequestBody extends object, ResponseBody> = {
	body: RequestBody | undefined
	requestBodySchema: ZodSchema<RequestBody> | undefined
} & CommonRequestParams<ResponseBody>

export type NoBodyRequestParams<ResponseBody> = {
	body?: never
	requestBodySchema?: never
} & CommonRequestParams<ResponseBody>

export type QueryParams<RequestQueryParams extends object | undefined, ResponseBody> = {
	queryParams: RequestQueryParams | undefined
	queryParamsSchema: ZodSchema<RequestQueryParams> | undefined
} & CommonRequestParams<ResponseBody>

export type NoQueryParams<ResponseBody> = {
	queryParams?: never
	queryParamsSchema?: never
} & CommonRequestParams<ResponseBody>

export type ResourceChangeParams<
	RequestBody,
	ResponseBody,
	RequestQueryParams extends object | undefined = undefined,
> = (RequestBody extends object
	? BodyRequestParams<RequestBody, ResponseBody>
	: NoBodyRequestParams<ResponseBody>) &
	(RequestQueryParams extends undefined
		? NoQueryParams<ResponseBody>
		: QueryParams<RequestQueryParams, ResponseBody>)

// We don't know which addons Wretch will have, and we don't really care, hence any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WretchInstance = Wretch<any, unknown, undefined>

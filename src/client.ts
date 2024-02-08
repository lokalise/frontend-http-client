import { stringify } from 'fast-querystring'
import { type ZodSchema, type ZodError, z } from 'zod'

import { type Either, failure, success, isFailure } from './either.js'
import type {
	CommonRequestParams,
	FreeQueryParams,
	QueryParams,
	ResourceChangeParams,
	WretchInstance,
} from './types.js'

function parseRequestBody<RequestBody>({
	body,
	requestBodySchema,
	path,
}: {
	body: RequestBody
	requestBodySchema?: ZodSchema<RequestBody>
	path: string
}): Either<ZodError, RequestBody> {
	if (!body) {
		return success(body)
	}

	if (!requestBodySchema) {
		return success(body as RequestBody)
	}

	const result = requestBodySchema.safeParse(body)

	if (!result.success) {
		console.error({
			path,
			body,
			error: result.error,
		})
		return failure(result.error)
	}

	return success(body)
}

function parseQueryParams<RequestQuerySchema extends z.Schema>({
	queryParams,
	queryParamsSchema,
	path,
}: {
	queryParams: z.input<RequestQuerySchema>
	queryParamsSchema?: RequestQuerySchema
	path: string
}): Either<ZodError, string> {
	if (!queryParams) {
		return success('')
	}

	if (!queryParamsSchema) {
		return success(`?${stringify(queryParams)}`)
	}

	const result = queryParamsSchema.safeParse(queryParams)

	if (!result.success) {
		console.error({
			path,
			queryParams,
			error: result.error,
		})
		return failure(result.error)
	}

	return success(`?${stringify(queryParams)}`)
}

function parseResponseBody<ResponseBody>({
	response,
	responseBodySchema,
	path,
}: {
	response: ResponseBody
	responseBodySchema?: ZodSchema<ResponseBody>
	path: string
}): Either<ZodError, ResponseBody> {
	if (!responseBodySchema) {
		return success(response)
	}

	const result = responseBodySchema.safeParse(response)

	if (!result.success) {
		console.error({
			path,
			response,
			error: result.error,
		})

		return failure(result.error)
	}

	return success(response)
}

async function sendResourceChange<
	T extends WretchInstance,
	ResponseBody,
	RequestBodySchema extends z.Schema | undefined = undefined,
	RequestQuerySchema extends z.Schema | undefined = undefined,
>(
	wretch: T,
	method: 'post' | 'put' | 'patch',
	params: ResourceChangeParams<RequestBodySchema, ResponseBody, RequestQuerySchema>,
) {
	const body = parseRequestBody({
		body: params.body,
		requestBodySchema: params.requestBodySchema,
		path: params.path,
	})

	if (isFailure(body)) {
		return Promise.reject(body.error)
	}

	const queryParams = parseQueryParams({
		queryParams: params.queryParams,
		queryParamsSchema: params.queryParamsSchema,
		path: params.path,
	})

	if (isFailure(queryParams)) {
		return Promise.reject(queryParams.error)
	}

	return wretch[method](body.result, `${params.path}${queryParams.result}`).res(
		async (response) => {
			if (response.headers.get('content-type')?.includes('application/json')) {
				const parsedResponse = parseResponseBody({
					response: (await response.json()) as ResponseBody,
					responseBodySchema: params.responseBodySchema,
					path: params.path,
				})

				if (isFailure(parsedResponse)) {
					return Promise.reject(parsedResponse.error)
				}

				return parsedResponse.result
			}

			return response as unknown as Promise<ResponseBody>
		},
	)
}

/* METHODS */

/* GET */

export async function sendGet<
	T extends WretchInstance,
	ResponseBody,
	RequestQuerySchema extends z.Schema | undefined = undefined,
>(
	wretch: T,
	params: RequestQuerySchema extends z.Schema
		? QueryParams<RequestQuerySchema, ResponseBody>
		: FreeQueryParams<ResponseBody>,
): Promise<ResponseBody> {
	const queryParams = parseQueryParams({
		queryParams: params.queryParams,
		queryParamsSchema: params.queryParamsSchema,
		path: params.path,
	})

	if (isFailure(queryParams)) {
		return Promise.reject(queryParams.error)
	}

	return wretch
		.get(`${params.path}${queryParams.result}`)
		.json()
		.then((response) => {
			const parsedResponse = parseResponseBody({
				response: response as ResponseBody,
				responseBodySchema: params.responseBodySchema,
				path: params.path,
			})

			if (isFailure(parsedResponse)) {
				return Promise.reject(parsedResponse.error)
			}

			return parsedResponse.result
		})
}

/* POST */

export function sendPost<
	T extends WretchInstance,
	ResponseBody,
	RequestBodySchema extends z.Schema | undefined = undefined,
	RequestQuerySchema extends z.Schema | undefined = undefined,
>(wretch: T, params: ResourceChangeParams<RequestBodySchema, ResponseBody, RequestQuerySchema>) {
	return sendResourceChange(wretch, 'post', params)
}

/* PUT */

export function sendPut<
	T extends WretchInstance,
	ResponseBody,
	RequestBodySchema extends z.Schema | undefined = undefined,
	RequestQuerySchema extends z.Schema | undefined = undefined,
>(wretch: T, params: ResourceChangeParams<RequestBodySchema, ResponseBody, RequestQuerySchema>) {
	return sendResourceChange(wretch, 'put', params)
}

/* PATCH */

export function sendPatch<
	T extends WretchInstance,
	ResponseBody,
	RequestBodySchema extends z.Schema | undefined = undefined,
	RequestQuerySchema extends z.Schema | undefined = undefined,
>(wretch: T, params: ResourceChangeParams<RequestBodySchema, ResponseBody, RequestQuerySchema>) {
	return sendResourceChange(wretch, 'patch', params)
}

/* DELETE */

export function sendDelete<T extends WretchInstance, ResponseBody>(
	wretch: T,
	params: Pick<CommonRequestParams<ResponseBody>, 'path'>,
) {
	return wretch.delete(params.path).res()
}

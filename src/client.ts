import { stringify } from 'fast-querystring'
import { type ZodSchema, type ZodError } from 'zod'

import { type Either, failure, success, isFailure } from './either'
import type {
	CommonRequestParams,
	NoQueryParams,
	QueryParams,
	ResourceChangeParams,
	WretchInstance,
} from './types'

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

function parseQueryParams<RequestQueryParams>({
	queryParams,
	queryParamsSchema,
	path,
}: {
	queryParams: RequestQueryParams
	queryParamsSchema?: ZodSchema<RequestQueryParams>
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
	RequestBody extends object | undefined = undefined,
	RequestQueryParams extends object | undefined = undefined,
>(
	wretch: T,
	method: 'post' | 'put' | 'patch',
	params: ResourceChangeParams<RequestBody, ResponseBody, RequestQueryParams>,
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
	RequestQueryParams extends object | undefined = undefined,
>(
	wretch: T,
	params: RequestQueryParams extends undefined
		? NoQueryParams<ResponseBody>
		: QueryParams<RequestQueryParams, ResponseBody>,
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
	RequestBody extends object | undefined = undefined,
	RequestQueryParams extends object | undefined = undefined,
>(wretch: T, params: ResourceChangeParams<RequestBody, ResponseBody, RequestQueryParams>) {
	return sendResourceChange(wretch, 'post', params)
}

/* PUT */

export function sendPut<
	T extends WretchInstance,
	ResponseBody,
	RequestBody extends object | undefined = undefined,
	RequestQueryParams extends object | undefined = undefined,
>(wretch: T, params: ResourceChangeParams<RequestBody, ResponseBody, RequestQueryParams>) {
	return sendResourceChange(wretch, 'put', params)
}

/* PATCH */

export function sendPatch<
	T extends WretchInstance,
	ResponseBody,
	RequestBody extends object | undefined = undefined,
	RequestQueryParams extends object | undefined = undefined,
>(wretch: T, params: ResourceChangeParams<RequestBody, ResponseBody, RequestQueryParams>) {
	return sendResourceChange(wretch, 'patch', params)
}

/* DELETE */

export function sendDelete<T extends WretchInstance, ResponseBody>(
	wretch: T,
	params: Pick<CommonRequestParams<ResponseBody>, 'path'>,
) {
	return wretch.delete(params.path).res()
}

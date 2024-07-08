import { stringify } from 'fast-querystring'
import type {WretchResponse} from "wretch";
import type { z } from 'zod'

import type {
	CommonRequestParams,
	FreeQueryParams,
	QueryParams,
	ResourceChangeParams,
	WretchInstance,
} from './types.js'
import { tryToResolveJsonBody } from './utils/bodyUtils.js'
import { type Either, failure, success, isFailure } from './utils/either.js'

function parseRequestBody<RequestBodySchema extends z.Schema>({
	body,
	requestBodySchema,
	path,
}: {
	body: unknown
	requestBodySchema?: RequestBodySchema
	path: string
}): Either<z.ZodError, z.input<RequestBodySchema>> {
	if (!body) {
		return success(body)
	}

	if (!requestBodySchema) {
		return success(body)
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
	queryParams: unknown
	queryParamsSchema?: RequestQuerySchema
	path: string
}): Either<z.ZodError, string> {
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

async function sendResourceChange<
	T extends WretchInstance,
	ResponseBody,
	RequestBodySchema extends z.Schema | undefined = undefined,
	RequestQuerySchema extends z.Schema | undefined = undefined,
>(
	wretch: T,
	method: 'post' | 'put' | 'patch',
	params: ResourceChangeParams<RequestBodySchema, ResponseBody, RequestQuerySchema>,
): Promise<ResponseBody | null>  {
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
			const bodyParseResult = await tryToResolveJsonBody(
				response,
				params.path,
				params.responseBodySchema,
			)

			if (bodyParseResult.error === 'NOT_JSON') {
				if (params.isNonJSONResponseExpected === false) {
					return Promise.reject(
						new Error(`Request to ${params.path} has returned an unexpected non-JSON response.`),
					)
				}
				return response as unknown as Promise<ResponseBody>
			}

			if (bodyParseResult.error === 'EMPTY_RESPONSE') {
				if (params.isEmptyResponseExpected === false) {
					return Promise.reject(
						new Error(`Request to ${params.path} has returned an unexpected empty response.`,
					))
				}

				return null
			}

			if (bodyParseResult.error) {
				return Promise.reject(bodyParseResult.error)
			}

			return bodyParseResult.result
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
): Promise<ResponseBody | null> {
	const queryParams = parseQueryParams({
		queryParams: params.queryParams,
		queryParamsSchema: params.queryParamsSchema,
		path: params.path,
	})

	if (isFailure(queryParams)) {
		return Promise.reject(queryParams.error)
	}

	return wretch.get(`${params.path}${queryParams.result}`).res(async (response) => {
		const bodyParseResult = await tryToResolveJsonBody(
			response,
			params.path,
			params.responseBodySchema,
		)

		if (bodyParseResult.error === 'NOT_JSON') {
			if (params.isNonJSONResponseExpected) {
				return response as unknown as Promise<ResponseBody>
			}
			return Promise.reject(
				`Request to ${params.path} has returned an unexpected non-JSON response.`,
			)
		}

		if (bodyParseResult.error === 'EMPTY_RESPONSE') {
			if (params.isEmptyResponseExpected) {
				return null
			}
			return Promise.reject(`Request to ${params.path} has returned an unexpected empty response.`)
		}

		if (bodyParseResult.error) {
			return Promise.reject(bodyParseResult.error)
		}

		return bodyParseResult.result
	})
}

/* POST */

export function sendPost<
	T extends WretchInstance,
	ResponseBody,
	RequestBodySchema extends z.Schema | undefined = undefined,
	RequestQuerySchema extends z.Schema | undefined = undefined,
>(wretch: T, params: ResourceChangeParams<RequestBodySchema, ResponseBody, RequestQuerySchema>): Promise<ResponseBody | null>  {
	return sendResourceChange(wretch, 'post', params)
}

/* PUT */

export function sendPut<
	T extends WretchInstance,
	ResponseBody,
	RequestBodySchema extends z.Schema | undefined = undefined,
	RequestQuerySchema extends z.Schema | undefined = undefined,
>(wretch: T, params: ResourceChangeParams<RequestBodySchema, ResponseBody, RequestQuerySchema>): Promise<ResponseBody | null>  {
	return sendResourceChange(wretch, 'put', params)
}

/* PATCH */

export function sendPatch<
	T extends WretchInstance,
	ResponseBody,
	RequestBodySchema extends z.Schema | undefined = undefined,
	RequestQuerySchema extends z.Schema | undefined = undefined,
>(wretch: T, params: ResourceChangeParams<RequestBodySchema, ResponseBody, RequestQuerySchema>): Promise<ResponseBody | null>  {
	return sendResourceChange(wretch, 'patch', params)
}

/* DELETE */

export function sendDelete<T extends WretchInstance, ResponseBody>(
	wretch: T,
	params: Pick<CommonRequestParams<ResponseBody>, 'path'>,
): Promise<WretchResponse> {
	return wretch.delete(params.path).res()
}

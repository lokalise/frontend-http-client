import type { WretchResponse } from 'wretch'
import type { ZodError, z } from 'zod'

import type { Either } from './either.js'
import { failure, success } from './either.js'

export function tryToResolveJsonBody<RequestBodySchema extends z.ZodSchema>(
	response: WretchResponse,
	path: string,
	schema: RequestBodySchema,
): Promise<
	Either<'NOT_JSON' | 'EMPTY_RESPONSE' | ZodError<RequestBodySchema>, z.output<RequestBodySchema>>
> {
	if (response.status === 204) {
		return Promise.resolve({
			error: 'EMPTY_RESPONSE',
		})
	}

	if (!response.headers.get('content-type')?.includes('application/json')) {
		return Promise.resolve({
			error: 'NOT_JSON',
		})
	}

	return response.json().then((responseBody: object) => {
		return parseResponseBody({
			response: responseBody,
			responseBodySchema: schema,
			path,
		})
	})
}

function parseResponseBody<ResponseBody>({
	response,
	responseBodySchema,
	path,
}: {
	response: ResponseBody
	responseBodySchema: z.ZodSchema<ResponseBody>
	path: string
}): Either<z.ZodError, ResponseBody> {
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

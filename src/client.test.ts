/* eslint-disable max-lines */
import failOnConsole from 'jest-fail-on-console'
import { getLocal } from 'mockttp'
import wretch from 'wretch'
import { z } from 'zod'

import { sendDelete, sendGet, sendPatch, sendPost, sendPut } from './client.js'

describe('frontend-http-client', () => {
	const mockServer = getLocal()

	beforeAll(() => {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		failOnConsole({
			silenceMessage: (message: string) => message.includes('ZodError'),
		})
	})
	beforeEach(() => mockServer.start())
	afterEach(() => mockServer.stop())

	describe('sendPost', () => {
		it('returns deserialized response', async () => {
			const client = wretch(mockServer.url)

			await mockServer.forPost('/').thenJson(200, { data: { code: 99 } })

			const responseSchema = z.object({
				data: z.object({
					code: z.number(),
				}),
			})

			const responseBody = await sendPost(client, {
				path: '/',
				responseBodySchema: responseSchema,
			})

			expect(responseBody).toEqual({
				data: {
					code: 99,
				},
			})
		})

		it('returns no content response', async () => {
			const client = wretch(mockServer.url)

			await mockServer.forPost('/').thenReply(204)

			const responseBody = await sendPost(client, {
				path: '/',
			})

			expect(responseBody).containSubset({
				status: 204,
				statusText: 'No Content',
			})
		})

		it('throws an error if response does not pass validation', async () => {
			const client = wretch(mockServer.url)

			await mockServer.forPost('/').thenJson(200, { data: { code: 99 } })

			const responseSchema = z.object({
				code: z.number(),
			})

			await expect(
				sendPost(client, {
					path: '/',
					responseBodySchema: responseSchema,
				}),
			).rejects.toThrowErrorMatchingInlineSnapshot(`
				[ZodError: [
				  {
				    "code": "invalid_type",
				    "expected": "number",
				    "received": "undefined",
				    "path": [
				      "code"
				    ],
				    "message": "Required"
				  }
				]]
			`)
		})

		it('throws an error if request does not pass validation', async () => {
			const client = wretch(mockServer.url)

			await mockServer.forPost('/').thenJson(200, { data: { code: 99 } })

			const requestSchema = z.object({
				requestCode: z.number(),
			})
			const responseSchema = z.object({
				code: z.number(),
			})

			await expect(
				sendPost(client, {
					path: '/',
					body: {} as any, // otherwise it breaks at compilation already
					requestBodySchema: requestSchema,
					responseBodySchema: responseSchema,
				}),
			).rejects.toThrowErrorMatchingInlineSnapshot(`
				[ZodError: [
				  {
				    "code": "invalid_type",
				    "expected": "number",
				    "received": "undefined",
				    "path": [
				      "requestCode"
				    ],
				    "message": "Required"
				  }
				]]
			`)
		})

		it('throws an error if query params does not pass validation', async () => {
			const client = wretch(mockServer.url)

			const testQueryParams = { param1: 'test', param2: 'test' }

			await mockServer.forPost('/').withQuery(testQueryParams).thenJson(200, { success: true })

			const queryParamsSchema = z.object({
				param1: z.string(),
				param2: z.number(),
			})

			const responseSchema = z.object({
				success: z.boolean(),
			})

			await expect(
				sendPost(client, {
					path: '/',
					queryParams: testQueryParams,
					queryParamsSchema: queryParamsSchema as any,
					responseBodySchema: responseSchema,
				}),
			).rejects.toThrowErrorMatchingInlineSnapshot(`
				[ZodError: [
				  {
				    "code": "invalid_type",
				    "expected": "number",
				    "received": "string",
				    "path": [
				      "param2"
				    ],
				    "message": "Expected number, received string"
				  }
				]]
			`)
		})

		it('allows posting request with correct params even if schemas are not provided', async () => {
			const client = wretch(mockServer.url)

			const testQueryParams = { param1: 'test', param2: 'test' }

			await mockServer.forPost('/').withQuery(testQueryParams).thenJson(200, { success: true })

			const responseSchema = z.object({
				success: z.boolean(),
			})

			const response = await sendPost(client, {
				path: '/',
				queryParams: testQueryParams,
				queryParamsSchema: undefined,
				responseBodySchema: responseSchema,
				body: { id: 1 },
				requestBodySchema: undefined,
			})

			expect(response).toEqual({ success: true })
		})

		it('correctly serializes and sends query parameters', async () => {
			const client = wretch(mockServer.url)

			const testQueryParams = { param1: 'test', param2: 123 }

			await mockServer.forPost('/').withQuery(testQueryParams).thenJson(200, { success: true })

			const requestSchema = z.object({
				param1: z.string(),
				param2: z.number(),
				param3: z.string().optional(),
			})

			const responseSchema = z.object({
				success: z.boolean(),
			})

			const response = await sendPost(client, {
				path: '/',
				queryParams: testQueryParams,
				queryParamsSchema: requestSchema,
				responseBodySchema: responseSchema,
			})

			expect(response).toEqual({ success: true })
		})

		it('correctly serializes and sends request body', async () => {
			const client = wretch(mockServer.url)

			await mockServer.forPost('/').thenJson(200, { success: true })

			const requestSchema = z.object({
				param1: z.string(),
			})

			const responseSchema = z.object({
				success: z.boolean(),
			})

			const response = await sendPost(client, {
				path: '/',
				body: { param1: 'test' },
				requestBodySchema: requestSchema,
				responseBodySchema: responseSchema,
			})

			expect(response).toEqual({ success: true })
		})

		it('allows posting request without responseBodySchema', async () => {
			const client = wretch(mockServer.url)

			await mockServer.forPost('/').thenJson(200, { success: true })

			const response = await sendPost(client, {
				path: '/',
			})

			expect(response).toEqual({ success: true })
		})

		it('should check types against schema input type', async () => {
			const client = wretch(mockServer.url)
			await mockServer.forPost('/').thenJson(200, { success: true })

			const schema = z.object({
				numberAsText: z
					.number()
					.transform((val) => val.toString())
					.pipe(z.string()),
			})
			const responseSchema = z.object({
				success: z.boolean(),
			})

			const response = await sendPost(client, {
				path: '/',
				queryParams: { numberAsText: 1 },
				queryParamsSchema: schema,
				responseBodySchema: responseSchema,
				body: { numberAsText: 1 },
				requestBodySchema: schema,
			})

			expect(response).toEqual({ success: true })
		})
	})

	describe('sendPut', () => {
		it('returns deserialized response', async () => {
			const client = wretch(mockServer.url)

			await mockServer.forPut('/').thenJson(200, { data: { code: 99 } })

			const responseSchema = z.object({
				data: z.object({
					code: z.number(),
				}),
			})

			const responseBody = await sendPut(client, {
				path: '/',
				responseBodySchema: responseSchema,
			})

			expect(responseBody).toEqual({
				data: {
					code: 99,
				},
			})
		})

		it('returns no content response', async () => {
			const client = wretch(mockServer.url)

			await mockServer.forPut('/').thenReply(204)

			const responseBody = await sendPut(client, {
				path: '/',
			})

			expect(responseBody).containSubset({
				status: 204,
				statusText: 'No Content',
			})
		})

		it('throws an error if response does not pass validation', async () => {
			const client = wretch(mockServer.url)

			await mockServer.forPut('/').thenJson(200, { data: { code: 99 } })

			const responseSchema = z.object({
				code: z.number(),
			})

			await expect(
				sendPut(client, {
					path: '/',
					responseBodySchema: responseSchema,
				}),
			).rejects.toThrowErrorMatchingInlineSnapshot(`
				[ZodError: [
				  {
				    "code": "invalid_type",
				    "expected": "number",
				    "received": "undefined",
				    "path": [
				      "code"
				    ],
				    "message": "Required"
				  }
				]]
			`)
		})

		it('throws an error if request does not pass validation', async () => {
			const client = wretch(mockServer.url)

			await mockServer.forPost('/').thenJson(200, { data: { code: 99 } })

			const requestSchema = z.object({
				requestCode: z.number(),
			})
			const responseSchema = z.object({
				code: z.number(),
			})

			await expect(
				sendPut(client, {
					path: '/',
					body: {} as any, // otherwise it breaks at compilation already
					requestBodySchema: requestSchema,
					responseBodySchema: responseSchema,
				}),
			).rejects.toThrowErrorMatchingInlineSnapshot(`
				[ZodError: [
				  {
				    "code": "invalid_type",
				    "expected": "number",
				    "received": "undefined",
				    "path": [
				      "requestCode"
				    ],
				    "message": "Required"
				  }
				]]
			`)
		})

		it('throws an error if query params does not pass validation', async () => {
			const client = wretch(mockServer.url)

			const testQueryParams = { param1: 'test', param2: 'test' }

			await mockServer.forPut('/').withQuery(testQueryParams).thenJson(200, { success: true })

			const queryParamsSchema = z.object({
				param1: z.string(),
				param2: z.number(),
			})

			const responseSchema = z.object({
				success: z.boolean(),
			})

			await expect(
				sendPut(client, {
					path: '/',
					queryParams: testQueryParams,
					queryParamsSchema: queryParamsSchema as any,
					responseBodySchema: responseSchema,
				}),
			).rejects.toThrowErrorMatchingInlineSnapshot(`
				[ZodError: [
				  {
				    "code": "invalid_type",
				    "expected": "number",
				    "received": "string",
				    "path": [
				      "param2"
				    ],
				    "message": "Expected number, received string"
				  }
				]]
			`)
		})

		it('correctly serializes and sends query parameters', async () => {
			const client = wretch(mockServer.url)

			const testQueryParams = { param1: 'test', param2: 123 }

			await mockServer.forPut('/').withQuery(testQueryParams).thenJson(200, { success: true })

			const requestSchema = z.object({
				param1: z.string(),
				param2: z.number(),
			})

			const responseSchema = z.object({
				success: z.boolean(),
			})

			const response = await sendPut(client, {
				path: '/',
				queryParams: testQueryParams,
				queryParamsSchema: requestSchema,
				responseBodySchema: responseSchema,
			})

			expect(response).toEqual({ success: true })
		})

		it('correctly serializes and sends request body', async () => {
			const client = wretch(mockServer.url)

			await mockServer.forPut('/').thenJson(200, { success: true })

			const requestSchema = z.object({
				param1: z.string(),
			})

			const responseSchema = z.object({
				success: z.boolean(),
			})

			const response = await sendPut(client, {
				path: '/',
				body: { param1: 'test' },
				requestBodySchema: requestSchema,
				responseBodySchema: responseSchema,
			})

			expect(response).toEqual({ success: true })
		})
	})

	describe('sendPatch', () => {
		it('returns deserialized response', async () => {
			const client = wretch(mockServer.url)

			await mockServer.forPatch('/').thenJson(200, { data: { code: 99 } })

			const responseSchema = z.object({
				data: z.object({
					code: z.number(),
				}),
			})

			const responseBody = await sendPatch(client, {
				path: '/',
				responseBodySchema: responseSchema,
			})

			expect(responseBody).toEqual({
				data: {
					code: 99,
				},
			})
		})

		it('throws an error if response does not pass validation', async () => {
			const client = wretch(mockServer.url)

			await mockServer.forPatch('/').thenJson(200, { data: { code: 99 } })

			const responseSchema = z.object({
				code: z.number(),
			})

			await expect(
				sendPatch(client, {
					path: '/',
					responseBodySchema: responseSchema,
				}),
			).rejects.toThrowErrorMatchingInlineSnapshot(`
				[ZodError: [
				  {
				    "code": "invalid_type",
				    "expected": "number",
				    "received": "undefined",
				    "path": [
				      "code"
				    ],
				    "message": "Required"
				  }
				]]
			`)
		})

		it('throws an error if request does not pass validation', async () => {
			const client = wretch(mockServer.url)

			await mockServer.forPatch('/').thenJson(200, { data: { code: 99 } })

			const requestSchema = z.object({
				requestCode: z.number(),
			})
			const responseSchema = z.object({
				code: z.number(),
			})

			await expect(
				sendPatch(client, {
					path: '/',
					body: {} as any, // otherwise it breaks at compilation already
					requestBodySchema: requestSchema,
					responseBodySchema: responseSchema,
				}),
			).rejects.toThrowErrorMatchingInlineSnapshot(`
				[ZodError: [
				  {
				    "code": "invalid_type",
				    "expected": "number",
				    "received": "undefined",
				    "path": [
				      "requestCode"
				    ],
				    "message": "Required"
				  }
				]]
			`)
		})

		it('throws an error if query params does not pass validation', async () => {
			const client = wretch(mockServer.url)

			const testQueryParams = { param1: 'test', param2: 'test' }

			await mockServer.forPatch('/').withQuery(testQueryParams).thenJson(200, { success: true })

			const queryParamsSchema = z.object({
				param1: z.string(),
				param2: z.number(),
			})

			const responseSchema = z.object({
				success: z.boolean(),
			})

			await expect(
				sendPatch(client, {
					path: '/',
					queryParams: testQueryParams,
					queryParamsSchema: queryParamsSchema as any,
					responseBodySchema: responseSchema,
				}),
			).rejects.toThrowErrorMatchingInlineSnapshot(`
				[ZodError: [
				  {
				    "code": "invalid_type",
				    "expected": "number",
				    "received": "string",
				    "path": [
				      "param2"
				    ],
				    "message": "Expected number, received string"
				  }
				]]
			`)
		})

		it('correctly serializes and sends query parameters', async () => {
			const client = wretch(mockServer.url)

			const testQueryParams = { param1: 'test', param2: 123 }

			await mockServer.forPatch('/').withQuery(testQueryParams).thenJson(200, { success: true })

			const requestSchema = z.object({
				param1: z.string(),
				param2: z.number(),
			})

			const responseSchema = z.object({
				success: z.boolean(),
			})

			const response = await sendPatch(client, {
				path: '/',
				queryParams: testQueryParams,
				queryParamsSchema: requestSchema,
				responseBodySchema: responseSchema,
			})

			expect(response).toEqual({ success: true })
		})

		it('correctly serializes and sends request body', async () => {
			const client = wretch(mockServer.url)

			await mockServer.forPatch('/').thenJson(200, { success: true })

			const requestSchema = z.object({
				param1: z.string(),
			})

			const responseSchema = z.object({
				success: z.boolean(),
			})

			const response = await sendPatch(client, {
				path: '/',
				body: { param1: 'test' },
				requestBodySchema: requestSchema,
				responseBodySchema: responseSchema,
			})

			expect(response).toEqual({ success: true })
		})
	})

	describe('sendGet', () => {
		it('returns deserialized response', async () => {
			const client = wretch(mockServer.url)

			await mockServer.forGet('/').thenJson(200, { data: { code: 99 } })

			const responseSchema = z.object({
				data: z.object({
					code: z.number(),
				}),
			})

			const responseBody = await sendGet(client, {
				path: '/',
				responseBodySchema: responseSchema,
			})

			expect(responseBody).toEqual({
				data: {
					code: 99,
				},
			})
		})

		it('throws an error if response does not pass validation', async () => {
			const client = wretch(mockServer.url)

			await mockServer.forGet('/').thenJson(200, { data: { code: 99 } })

			const responseSchema = z.object({
				code: z.number(),
			})

			await expect(
				sendGet(client, {
					path: '/',
					responseBodySchema: responseSchema,
				}),
			).rejects.toThrowErrorMatchingInlineSnapshot(`
				[ZodError: [
				  {
				    "code": "invalid_type",
				    "expected": "number",
				    "received": "undefined",
				    "path": [
				      "code"
				    ],
				    "message": "Required"
				  }
				]]
			`)
		})

		it('throws an error if request does not pass validation', async () => {
			const client = wretch(mockServer.url)

			await mockServer.forGet('/').thenJson(200, { data: { code: 99 } })

			const requestSchema = z.object({
				requestCode: z.number(),
			})
			const responseSchema = z.object({
				code: z.number(),
			})

			await expect(
				sendGet(client, {
					path: '/',
					queryParams: {} as any, // otherwise it breaks at compilation already
					queryParamsSchema: requestSchema,
					responseBodySchema: responseSchema,
				}),
			).rejects.toThrowErrorMatchingInlineSnapshot(`
				[ZodError: [
				  {
				    "code": "invalid_type",
				    "expected": "number",
				    "received": "undefined",
				    "path": [
				      "requestCode"
				    ],
				    "message": "Required"
				  }
				]]
			`)
		})

		it('returns correct data if everything is ok', async () => {
			const client = wretch(mockServer.url)

			await mockServer.forGet('/').thenJson(200, { data: { code: 99 } })

			const requestSchema = z.object({
				requestCode: z.coerce.number(),
			})
			const responseSchema = z.object({
				data: z.object({
					code: z.number(),
				}),
			})

			const response = await sendGet(client, {
				path: '/',
				queryParams: {
					requestCode: 99,
				},
				queryParamsSchema: requestSchema,
				responseBodySchema: responseSchema,
			})

			expect(response.data.code).toBe(99)
		})

		it('should work without specifying an schema', async () => {
			const client = wretch(mockServer.url)

			await mockServer.forGet('/').thenJson(200, { data: { code: 99 } })

			const responseSchema = z.object({
				data: z.object({
					code: z.number(),
				}),
			})

			const response = await sendGet(client, {
				path: '/',
				queryParams: {
					requestCode: 99,
				},
				queryParamsSchema: undefined,
				responseBodySchema: responseSchema,
			})

			expect(response.data.code).toBe(99)
		})

		it('should check types against schema input type', async () => {
			const client = wretch(mockServer.url)
			await mockServer.forGet('/').thenJson(200, { data: { code: 99 } })

			const querySchema = z.object({
				numberAsText: z
					.number()
					.transform((val) => val.toString())
					.pipe(z.string()),
			})
			const responseSchema = z.object({
				data: z.object({
					code: z.number(),
				}),
			})

			const responseBody = await sendGet(client, {
				path: '/',
				queryParams: { numberAsText: 1 },
				queryParamsSchema: querySchema,
				responseBodySchema: responseSchema,
			})

			expect(responseBody).toEqual({
				data: {
					code: 99,
				},
			})
		})
	})

	describe('sendDelete', () => {
		it('returns a status if proceeded', async () => {
			const client = wretch(mockServer.url)

			await mockServer.forDelete('/').thenReply(204)

			const response = await sendDelete(client, {
				path: '/',
			})

			expect(response).toMatchObject({ status: 204 })
		})
	})
})

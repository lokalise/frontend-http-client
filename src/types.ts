import type { Wretch, WretchResponse } from 'wretch'
import type { ZodSchema, z } from 'zod'

type FreeformRecord = Record<string, unknown>

export type CommonRequestParams<
  ResponseBody,
  IsNonJSONResponseExpected extends boolean,
  IsEmptyResponseExpected extends boolean,
> = {
  path: string
  responseBodySchema: ZodSchema<ResponseBody>
  isEmptyResponseExpected?: IsEmptyResponseExpected // 204 is considered a success. Default is "false" for GET operations and "true" for everything else
  isNonJSONResponseExpected?: IsNonJSONResponseExpected // Do not throw an error if not receiving 'application/json' content-type.  Default is "false" for GET operations and "true" for everything else
}

export type BodyRequestParams<
  RequestBodySchema extends z.ZodSchema,
  ResponseBody,
  IsNonJSONResponseExpected extends boolean,
  IsEmptyResponseExpected extends boolean,
> = {
  body: z.input<RequestBodySchema> | undefined
  requestBodySchema: RequestBodySchema | undefined
} & CommonRequestParams<ResponseBody, IsNonJSONResponseExpected, IsEmptyResponseExpected>

export type FreeBodyRequestParams<
  ResponseBody,
  IsNonJSONResponseExpected extends boolean,
  IsEmptyResponseExpected extends boolean,
> = {
  body?: FreeformRecord
  requestBodySchema?: never
} & CommonRequestParams<ResponseBody, IsNonJSONResponseExpected, IsEmptyResponseExpected>

export type QueryParams<
  RequestQuerySchema extends z.ZodSchema,
  ResponseBody,
  IsNonJSONResponseExpected extends boolean,
  IsEmptyResponseExpected extends boolean,
> = {
  queryParams: z.input<RequestQuerySchema> | undefined
  queryParamsSchema: RequestQuerySchema | undefined
} & CommonRequestParams<ResponseBody, IsNonJSONResponseExpected, IsEmptyResponseExpected>

export type FreeQueryParams<
  ResponseBody,
  IsNonJSONResponseExpected extends boolean,
  IsEmptyResponseExpected extends boolean,
> = {
  queryParams?: FreeformRecord
  queryParamsSchema?: never
} & CommonRequestParams<ResponseBody, IsNonJSONResponseExpected, IsEmptyResponseExpected>

export type DeleteParams<
  RequestQuerySchema extends z.ZodSchema,
  ResponseBody,
  IsNonJSONResponseExpected extends boolean,
  IsEmptyResponseExpected extends boolean,
> = {
  queryParams: z.input<RequestQuerySchema> | undefined
  queryParamsSchema: RequestQuerySchema | undefined
} & Omit<
  CommonRequestParams<ResponseBody, IsNonJSONResponseExpected, IsEmptyResponseExpected>,
  'responseBodySchema'
> & {
    responseBodySchema?: ZodSchema<ResponseBody>
  }

export type FreeDeleteParams<
  ResponseBody,
  IsNonJSONResponseExpected extends boolean,
  IsEmptyResponseExpected extends boolean,
> = {
  queryParams?: FreeformRecord
  queryParamsSchema?: never
} & Omit<
  CommonRequestParams<ResponseBody, IsNonJSONResponseExpected, IsEmptyResponseExpected>,
  'responseBodySchema'
> & {
    responseBodySchema?: ZodSchema<ResponseBody>
  }

export type RequestResultType<
  ResponseBody,
  isNonJSONResponseExpected extends boolean,
  isEmptyResponseExpected extends boolean,
> = isEmptyResponseExpected extends true
  ? isNonJSONResponseExpected extends true
    ? WretchResponse | null
    : ResponseBody | null
  : isNonJSONResponseExpected extends true
    ? WretchResponse
    : ResponseBody

export type ResourceChangeParams<
  RequestBody,
  ResponseBody,
  IsNonJSONResponseExpected extends boolean,
  IsEmptyResponseExpected extends boolean,
  RequestQuerySchema extends z.Schema | undefined = undefined,
> = (RequestBody extends z.Schema
  ? BodyRequestParams<RequestBody, ResponseBody, IsNonJSONResponseExpected, IsEmptyResponseExpected>
  : FreeBodyRequestParams<ResponseBody, IsNonJSONResponseExpected, IsEmptyResponseExpected>) &
  (RequestQuerySchema extends z.Schema
    ? QueryParams<
        RequestQuerySchema,
        ResponseBody,
        IsNonJSONResponseExpected,
        IsEmptyResponseExpected
      >
    : FreeQueryParams<ResponseBody, IsNonJSONResponseExpected, IsEmptyResponseExpected>)

export type ResourceChangeByDefinitionParams<
  PathParamsSchema extends z.Schema | undefined = undefined,
  RequestBodySchema extends z.Schema | undefined = undefined,
  RequestQuerySchema extends z.Schema | undefined = undefined,
  RequestHeaderSchema extends z.Schema | undefined = undefined,
> = {
  body: RequestBodySchema extends z.Schema ? z.input<RequestBodySchema> : never
  queryParams: RequestQuerySchema extends z.Schema ? z.input<RequestQuerySchema> : never
  headers: RequestHeaderSchema extends z.Schema ? z.input<RequestHeaderSchema> : never
  pathParams: PathParamsSchema extends z.Schema ? z.infer<PathParamsSchema> : never
}

// biome-ignore lint/suspicious/noExplicitAny: We don't know which addons Wretch will have, and we don't really care, hence any
export type WretchInstance = Wretch<any, unknown, undefined>

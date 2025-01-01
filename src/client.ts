import { z } from 'zod'

import type { ResourceChangeRouteDefinition } from './routeDefinition.js'
import type {
  DeleteParams,
  FreeDeleteParams,
  FreeQueryParams,
  QueryParams,
  RequestResultType,
  ResourceChangeByDefinitionParams,
  ResourceChangeParams,
  WretchInstance,
} from './types.js'
import { parseRequestBody, tryToResolveJsonBody } from './utils/bodyUtils.js'
import { isFailure } from './utils/either.js'
import { buildWretchError } from './utils/errorUtils.js'
import { parseQueryParams } from './utils/queryUtils.js'

export const UNKNOWN_SCHEMA = z.unknown()

function sendResourceChange<
  T extends WretchInstance,
  ResponseBody,
  IsNonJSONResponseExpected extends boolean,
  IsEmptyResponseExpected extends boolean,
  RequestBodySchema extends z.Schema | undefined = undefined,
  RequestQuerySchema extends z.Schema | undefined = undefined,
>(
  wretch: T,
  method: 'post' | 'put' | 'patch',
  params: ResourceChangeParams<
    RequestBodySchema,
    ResponseBody,
    IsNonJSONResponseExpected,
    IsEmptyResponseExpected,
    RequestQuerySchema
  >,
): Promise<RequestResultType<ResponseBody, IsNonJSONResponseExpected, IsEmptyResponseExpected>> {
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
            buildWretchError(
              `Request to ${params.path} has returned an unexpected non-JSON response.`,
              response,
            ),
          )
        }
        return response
      }

      if (bodyParseResult.error === 'EMPTY_RESPONSE') {
        if (params.isEmptyResponseExpected === false) {
          return Promise.reject(
            buildWretchError(
              `Request to ${params.path} has returned an unexpected empty response.`,
              response,
            ),
          )
        }

        return null
      }

      if (bodyParseResult.error) {
        return Promise.reject(bodyParseResult.error)
      }

      return bodyParseResult.result
    },
  ) as Promise<RequestResultType<ResponseBody, IsNonJSONResponseExpected, IsEmptyResponseExpected>>
}

/* METHODS */

/* GET */

export function sendGet<
  T extends WretchInstance,
  ResponseBody,
  RequestQuerySchema extends z.Schema | undefined = undefined,
  IsNonJSONResponseExpected extends boolean = false,
  IsEmptyResponseExpected extends boolean = false,
>(
  wretch: T,
  params: RequestQuerySchema extends z.Schema
    ? QueryParams<
        RequestQuerySchema,
        ResponseBody,
        IsNonJSONResponseExpected,
        IsEmptyResponseExpected
      >
    : FreeQueryParams<ResponseBody, IsNonJSONResponseExpected, IsEmptyResponseExpected>,
): Promise<RequestResultType<ResponseBody, IsNonJSONResponseExpected, IsEmptyResponseExpected>> {
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
        return response
      }
      return Promise.reject(
        buildWretchError(
          `Request to ${params.path} has returned an unexpected non-JSON response.`,
          response,
        ),
      )
    }

    if (bodyParseResult.error === 'EMPTY_RESPONSE') {
      if (params.isEmptyResponseExpected) {
        return null
      }
      return Promise.reject(
        buildWretchError(
          `Request to ${params.path} has returned an unexpected empty response.`,
          response,
        ),
      )
    }

    if (bodyParseResult.error) {
      return Promise.reject(bodyParseResult.error)
    }

    return bodyParseResult.result
  }) as Promise<RequestResultType<ResponseBody, IsNonJSONResponseExpected, IsEmptyResponseExpected>>
}

/* POST */

export function sendPost<
  T extends WretchInstance,
  ResponseBody,
  RequestBodySchema extends z.Schema | undefined = undefined,
  RequestQuerySchema extends z.Schema | undefined = undefined,
  IsNonJSONResponseExpected extends boolean = false,
  IsEmptyResponseExpected extends boolean = false,
>(
  wretch: T,
  params: ResourceChangeParams<
    RequestBodySchema,
    ResponseBody,
    IsNonJSONResponseExpected,
    IsEmptyResponseExpected,
    RequestQuerySchema
  >,
): Promise<RequestResultType<ResponseBody, IsNonJSONResponseExpected, IsEmptyResponseExpected>> {
  return sendResourceChange(wretch, 'post', params)
}

/* PUT */

export function sendPut<
  T extends WretchInstance,
  ResponseBody,
  RequestBodySchema extends z.Schema | undefined = undefined,
  RequestQuerySchema extends z.Schema | undefined = undefined,
  IsNonJSONResponseExpected extends boolean = false,
  IsEmptyResponseExpected extends boolean = false,
>(
  wretch: T,
  params: ResourceChangeParams<
    RequestBodySchema,
    ResponseBody,
    IsNonJSONResponseExpected,
    IsEmptyResponseExpected,
    RequestQuerySchema
  >,
): Promise<RequestResultType<ResponseBody, IsNonJSONResponseExpected, IsEmptyResponseExpected>> {
  return sendResourceChange(wretch, 'put', params)
}

/* PATCH */

export function sendPatch<
  T extends WretchInstance,
  ResponseBody,
  RequestBodySchema extends z.Schema | undefined = undefined,
  RequestQuerySchema extends z.Schema | undefined = undefined,
  IsNonJSONResponseExpected extends boolean = false,
  IsEmptyResponseExpected extends boolean = false,
>(
  wretch: T,
  params: ResourceChangeParams<
    RequestBodySchema,
    ResponseBody,
    IsNonJSONResponseExpected,
    IsEmptyResponseExpected,
    RequestQuerySchema
  >,
): Promise<RequestResultType<ResponseBody, IsNonJSONResponseExpected, IsEmptyResponseExpected>> {
  return sendResourceChange(wretch, 'patch', params)
}

/* DELETE */

export function sendDelete<
  T extends WretchInstance,
  ResponseBody,
  RequestQuerySchema extends z.Schema | undefined = undefined,
  IsNonJSONResponseExpected extends boolean = false,
  IsEmptyResponseExpected extends boolean = true,
>(
  wretch: T,
  params: RequestQuerySchema extends z.Schema
    ? DeleteParams<
        RequestQuerySchema,
        ResponseBody,
        IsNonJSONResponseExpected,
        IsEmptyResponseExpected
      >
    : FreeDeleteParams<ResponseBody, IsNonJSONResponseExpected, IsEmptyResponseExpected>,
): Promise<RequestResultType<ResponseBody, IsNonJSONResponseExpected, IsEmptyResponseExpected>> {
  const queryParams = parseQueryParams({
    queryParams: params.queryParams,
    queryParamsSchema: params.queryParamsSchema,
    path: params.path,
  })

  if (isFailure(queryParams)) {
    return Promise.reject(queryParams.error)
  }

  return wretch.delete(`${params.path}${queryParams.result}`).res(async (response) => {
    const bodyParseResult = await tryToResolveJsonBody(
      response,
      params.path,
      params.responseBodySchema ?? UNKNOWN_SCHEMA,
    )

    if (bodyParseResult.error === 'NOT_JSON') {
      if (params.isNonJSONResponseExpected === false) {
        return Promise.reject(
          buildWretchError(
            `Request to ${params.path} has returned an unexpected non-JSON response.`,
            response,
          ),
        )
      }

      return response
    }

    if (bodyParseResult.error === 'EMPTY_RESPONSE') {
      if (params.isEmptyResponseExpected === false) {
        return Promise.reject(
          buildWretchError(
            `Request to ${params.path} has returned an unexpected empty response.`,
            response,
          ),
        )
      }

      return null
    }

    if (bodyParseResult.error) {
      return Promise.reject(bodyParseResult.error)
    }

    return bodyParseResult.result
  }) as Promise<RequestResultType<ResponseBody, IsNonJSONResponseExpected, IsEmptyResponseExpected>>
}

export function sendByRouteDefinition<
  T extends WretchInstance,
  IsNonJSONResponseExpected extends boolean,
  IsEmptyResponseExpected extends boolean,
  RequestBodySchema extends z.Schema | undefined = undefined,
  ResponseBodySchema extends z.Schema | undefined = undefined,
  PathParamsSchema extends z.Schema | undefined = undefined,
  RequestQuerySchema extends z.Schema | undefined = undefined,
  RequestHeaderSchema extends z.Schema | undefined = undefined,
>(
  wretch: T,
  routeDefinition: ResourceChangeRouteDefinition<
    IsNonJSONResponseExpected,
    IsEmptyResponseExpected,
    RequestBodySchema,
    ResponseBodySchema,
    PathParamsSchema,
    RequestQuerySchema,
    RequestHeaderSchema
  >,
  params: ResourceChangeByDefinitionParams<
    PathParamsSchema,
    RequestBodySchema,
    RequestQuerySchema,
    RequestHeaderSchema
  >,
) {
  return sendResourceChange(wretch, routeDefinition.method, {
    body: params.body,
    isEmptyResponseExpected: routeDefinition.isEmptyResponseExpected,
    isNonJSONResponseExpected: routeDefinition.isNonJSONResponseExpected,
    // biome-ignore lint/suspicious/noExplicitAny: FixMe try to find a solution
    requestBodySchema: routeDefinition.requestBodySchema as any,
    // biome-ignore lint/suspicious/noExplicitAny: FixMe try to find a solution
    responseBodySchema: routeDefinition.responseBodySchema as any,
    queryParams: params.queryParams,
    queryParamsSchema: routeDefinition.requestQuerySchema,
    path: routeDefinition.pathResolver(params.pathParams),
  })
}

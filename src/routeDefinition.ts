import type { ZodSchema, z } from 'zod'

export type RoutePathResolver<PathParams> = (pathParams: PathParams) => string

export type InferSchemaOutput<T extends ZodSchema | undefined> = T extends ZodSchema<infer U>
  ? U
  : T extends undefined
    ? undefined
    : never

export function buildRouteDefinition<
  IsNonJSONResponseExpected extends boolean,
  IsEmptyResponseExpected extends boolean,
  PathParams,
  RequestBodySchema extends z.Schema | undefined = undefined,
  ResponseBodySchema extends z.Schema | undefined = undefined,
  PathParamsSchema extends z.Schema<PathParams> | undefined = undefined,
  RequestQuerySchema extends z.Schema | undefined = undefined,
  RequestHeaderSchema extends z.Schema | undefined = undefined,
>(
  params: ResourceChangeRouteDefinition<
    IsNonJSONResponseExpected,
    IsEmptyResponseExpected,
    RequestBodySchema,
    ResponseBodySchema,
    PathParamsSchema,
    RequestQuerySchema,
    RequestHeaderSchema
  >,
): ResourceChangeRouteDefinition<
  IsNonJSONResponseExpected,
  IsEmptyResponseExpected,
  RequestBodySchema,
  ResponseBodySchema,
  PathParamsSchema,
  RequestQuerySchema,
  RequestHeaderSchema
> {
  return params
}

export type ResourceChangeRouteDefinition<
  IsNonJSONResponseExpected extends boolean,
  IsEmptyResponseExpected extends boolean,
  PathParams,
  RequestBodySchema extends z.Schema | undefined = undefined,
  ResponseBodySchema extends z.Schema | undefined = undefined,
  PathParamsSchema extends z.Schema<PathParams> | undefined = undefined,
  RequestQuerySchema extends z.Schema | undefined = undefined,
  RequestHeaderSchema extends z.Schema | undefined = undefined,
> = {
  method: 'post' | 'put' | 'patch'
  isNonJSONResponseExpected: IsNonJSONResponseExpected
  isEmptyResponseExpected: IsEmptyResponseExpected
  requestBodySchema: RequestBodySchema
  responseBodySchema: ResponseBodySchema
  requestPathParamsSchema: PathParamsSchema
  requestQuerySchema?: RequestQuerySchema
  requestHeaderSchema?: RequestHeaderSchema
  pathResolver: RoutePathResolver<InferSchemaOutput<PathParamsSchema>>
}

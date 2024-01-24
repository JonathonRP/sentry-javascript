import { convertIntegrationFnToClass, defineIntegration } from '@sentry/core';
import { getClient, startInactiveSpan } from '@sentry/node';
import type { Client, Integration, IntegrationClass, IntegrationFn, Span } from '@sentry/types';
import { fill } from '@sentry/utils';
// 'aws-sdk/global' import is expected to be type-only so it's erased in the final .js file.
// When TypeScript compiler is upgraded, use `import type` syntax to explicitly assert that we don't want to load a module here.
import type * as AWS from 'aws-sdk/global';

type GenericParams = { [key: string]: any }; // eslint-disable-line @typescript-eslint/no-explicit-any
type MakeRequestCallback<TResult> = (err: AWS.AWSError, data: TResult) => void;
// This interace could be replaced with just type alias once the `strictBindCallApply` mode is enabled.
interface MakeRequestFunction<TParams, TResult> extends CallableFunction {
  (operation: string, params?: TParams, callback?: MakeRequestCallback<TResult>): AWS.Request<TResult, AWS.AWSError>;
}
interface AWSService {
  serviceIdentifier: string;
}

const INTEGRATION_NAME = 'AWSServices';

const SETUP_CLIENTS = new WeakMap<Client, boolean>();

const _awsServicesIntegration = ((options: { optional?: boolean } = {}) => {
  const optional = options.optional || false;
  return {
    name: INTEGRATION_NAME,
    setupOnce() {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const awsModule = require('aws-sdk/global') as typeof AWS;
        fill(awsModule.Service.prototype, 'makeRequest', wrapMakeRequest);
      } catch (e) {
        if (!optional) {
          throw e;
        }
      }
    },
    setup(client) {
      SETUP_CLIENTS.set(client, true);
    },
  };
}) satisfies IntegrationFn;

export const awsServicesIntegration = defineIntegration(_awsServicesIntegration);

/**
 * AWS Service Request Tracking.
 *
 * @deprecated Use `awsServicesIntegration()` instead.
 */
// eslint-disable-next-line deprecation/deprecation
export const AWSServices = convertIntegrationFnToClass(
  INTEGRATION_NAME,
  awsServicesIntegration,
) as IntegrationClass<Integration>;

/**
 * Patches AWS SDK request to create `http.client` spans.
 */
function wrapMakeRequest<TService extends AWSService, TResult>(
  orig: MakeRequestFunction<GenericParams, TResult>,
): MakeRequestFunction<GenericParams, TResult> {
  return function (this: TService, operation: string, params?: GenericParams, callback?: MakeRequestCallback<TResult>) {
    let span: Span | undefined;
    const req = orig.call(this, operation, params);
    // Only instrument if integration is active on client
    if (SETUP_CLIENTS.has(getClient() as Client)) {
      req.on('afterBuild', () => {
        span = startInactiveSpan({
          name: describe(this, operation, params),
          op: 'http.client',
          origin: 'auto.http.serverless',
        });
      });
      req.on('complete', () => {
        if (span) {
          span.end();
        }
      });
    }
    if (callback) {
      req.send(callback);
    }
    return req;
  };
}

/** Describes an operation on generic AWS service */
function describe<TService extends AWSService>(service: TService, operation: string, params?: GenericParams): string {
  let ret = `aws.${service.serviceIdentifier}.${operation}`;
  if (params === undefined) {
    return ret;
  }
  switch (service.serviceIdentifier) {
    case 's3':
      ret += describeS3Operation(operation, params);
      break;
    case 'lambda':
      ret += describeLambdaOperation(operation, params);
      break;
  }
  return ret;
}

/** Describes an operation on AWS Lambda service */
function describeLambdaOperation(_operation: string, params: GenericParams): string {
  let ret = '';
  if ('FunctionName' in params) {
    ret += ` ${params.FunctionName}`;
  }
  return ret;
}

/** Describes an operation on AWS S3 service */
function describeS3Operation(_operation: string, params: GenericParams): string {
  let ret = '';
  if ('Bucket' in params) {
    ret += ` ${params.Bucket}`;
  }
  return ret;
}

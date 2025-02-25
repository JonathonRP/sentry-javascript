import {
  SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN,
  SEMANTIC_ATTRIBUTE_SENTRY_SOURCE,
  addTracingExtensions,
  captureException,
  continueTrace,
  handleCallbackErrors,
  startSpan,
} from '@sentry/core';
import { winterCGRequestToRequestData } from '@sentry/utils';

import type { EdgeRouteHandler } from '../../edge/types';
import { flushQueue } from './responseEnd';

/**
 * Wraps a function on the edge runtime with error and performance monitoring.
 */
export function withEdgeWrapping<H extends EdgeRouteHandler>(
  handler: H,
  options: { spanDescription: string; spanOp: string; mechanismFunctionName: string },
): (...params: Parameters<H>) => Promise<ReturnType<H>> {
  return async function (this: unknown, ...args) {
    addTracingExtensions();
    const req: unknown = args[0];

    let sentryTrace;
    let baggage;

    if (req instanceof Request) {
      sentryTrace = req.headers.get('sentry-trace') || '';
      baggage = req.headers.get('baggage');
    }

    const transactionContext = continueTrace({
      sentryTrace,
      baggage,
    });

    return startSpan(
      {
        ...transactionContext,
        name: options.spanDescription,
        op: options.spanOp,
        attributes: {
          [SEMANTIC_ATTRIBUTE_SENTRY_SOURCE]: 'route',
          [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: 'auto.function.nextjs.withEdgeWrapping',
        },
        metadata: {
          // eslint-disable-next-line deprecation/deprecation
          ...transactionContext.metadata,
          request: req instanceof Request ? winterCGRequestToRequestData(req) : undefined,
        },
      },
      async span => {
        const handlerResult = await handleCallbackErrors(
          () => handler.apply(this, args),
          error => {
            captureException(error, {
              mechanism: {
                type: 'instrument',
                handled: false,
                data: {
                  function: options.mechanismFunctionName,
                },
              },
            });
          },
        );

        if (handlerResult instanceof Response) {
          span?.setHttpStatus(handlerResult.status);
        } else {
          span?.setStatus('ok');
        }

        return handlerResult;
      },
    ).finally(() => flushQueue());
  };
}

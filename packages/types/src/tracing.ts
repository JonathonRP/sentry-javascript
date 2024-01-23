import type { DynamicSamplingContext } from './envelope';

export type TracePropagationTargets = (string | RegExp)[];

/**
 * `PropagationContext` represents the data from an incoming trace. It should be constructed from incoming trace data,
 * usually represented by `sentry-trace` and `baggage` HTTP headers.
 *
 * There is always a propagation context present in the SDK (or rather on Scopes), holding at least a `traceId`. This is
 * to ensure that there is always a trace we can attach events onto, even if performance monitoring is disabled. If
 * there was no incoming `traceId`, the `traceId` will be generated by the current SDK.
 */
export interface PropagationContext {
  /**
   * Either represents the incoming `traceId` or the `traceId` generated by the current SDK, if there was no incoming trace.
   */
  traceId: string;
  /**
   * Represents the execution context of the current SDK. This acts as a fallback value to associate events with a
   * particular execution context when performance monitoring is disabled.
   *
   * The ID of a current span (if one exists) should have precedence over this value when propagating trace data.
   */
  spanId: string;
  /**
   * Represents the sampling decision of the incoming trace.
   *
   * The current SDK should not modify this value!
   */
  sampled?: boolean;
  /**
   * The `parentSpanId` denotes the ID of the incoming client span. If there is no `parentSpanId` on the propagation
   * context, it means that the the incoming trace didn't come from a span.
   *
   * The current SDK should not modify this value!
   */
  parentSpanId?: string;
  /**
   * An undefined dsc in the propagation context means that the current SDK invocation is the head of trace and still free to modify and set the DSC for outgoing requests.
   *
   * The current SDK should not modify this value!
   */
  dsc?: DynamicSamplingContext;
}

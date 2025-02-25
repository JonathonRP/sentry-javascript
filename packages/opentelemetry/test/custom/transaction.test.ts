import { setCurrentClient, spanToJSON } from '@sentry/core';
import { getCurrentHub } from '../../src/custom/hub';
import { OpenTelemetryScope } from '../../src/custom/scope';
import { OpenTelemetryTransaction, startTransaction } from '../../src/custom/transaction';
import { TestClient, getDefaultTestClientOptions } from '../helpers/TestClient';

describe('NodeExperimentalTransaction', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('works with finishWithScope without arguments', () => {
    const client = new TestClient(getDefaultTestClientOptions());

    const mockSend = jest.spyOn(client, 'captureEvent').mockImplementation(() => 'mocked');

    const hub = getCurrentHub();
    setCurrentClient(client);
    client.init();

    // eslint-disable-next-line deprecation/deprecation
    const transaction = new OpenTelemetryTransaction({ name: 'test', sampled: true }, hub);

    const res = transaction.finishWithScope();

    expect(mockSend).toBeCalledTimes(1);
    expect(mockSend).toBeCalledWith(
      expect.objectContaining({
        contexts: {
          trace: {
            data: {
              'sentry.origin': 'manual',
            },
            span_id: expect.any(String),
            trace_id: expect.any(String),
            origin: 'manual',
          },
        },
        spans: [],
        start_timestamp: expect.any(Number),
        tags: {},
        timestamp: expect.any(Number),
        transaction: 'test',
        type: 'transaction',
        sdkProcessingMetadata: {
          source: 'custom',
          spanMetadata: {},
          dynamicSamplingContext: {
            environment: 'production',
            trace_id: expect.any(String),
            transaction: 'test',
            sampled: 'true',
          },
        },
        transaction_info: { source: 'custom' },
      }),
      { event_id: expect.any(String) },
      undefined,
    );
    expect(res).toBe('mocked');
  });

  it('works with finishWithScope with endTime', () => {
    const client = new TestClient(getDefaultTestClientOptions());

    const mockSend = jest.spyOn(client, 'captureEvent').mockImplementation(() => 'mocked');

    const hub = getCurrentHub();
    setCurrentClient(client);
    client.init();

    // eslint-disable-next-line deprecation/deprecation
    const transaction = new OpenTelemetryTransaction({ name: 'test', startTimestamp: 123456, sampled: true }, hub);

    const res = transaction.finishWithScope(1234567);

    expect(mockSend).toBeCalledTimes(1);
    expect(mockSend).toBeCalledWith(
      expect.objectContaining({
        start_timestamp: 123456,
        timestamp: 1234567,
      }),
      { event_id: expect.any(String) },
      undefined,
    );
    expect(res).toBe('mocked');
  });

  it('works with finishWithScope with endTime & scope', () => {
    const client = new TestClient(getDefaultTestClientOptions());

    const mockSend = jest.spyOn(client, 'captureEvent').mockImplementation(() => 'mocked');

    const hub = getCurrentHub();
    setCurrentClient(client);
    client.init();

    // eslint-disable-next-line deprecation/deprecation
    const transaction = new OpenTelemetryTransaction({ name: 'test', startTimestamp: 123456, sampled: true }, hub);

    const scope = new OpenTelemetryScope();
    scope.setTags({
      tag1: 'yes',
      tag2: 'no',
    });
    scope.setContext('os', { name: 'Custom OS' });

    const res = transaction.finishWithScope(1234567, scope);

    expect(mockSend).toBeCalledTimes(1);
    expect(mockSend).toBeCalledWith(
      expect.objectContaining({
        contexts: {
          trace: {
            data: {
              'sentry.origin': 'manual',
            },
            span_id: expect.any(String),
            trace_id: expect.any(String),
            origin: 'manual',
          },
        },
        spans: [],
        start_timestamp: 123456,
        tags: {},
        timestamp: 1234567,
        transaction: 'test',
        type: 'transaction',
        sdkProcessingMetadata: {
          source: 'custom',
          spanMetadata: {},
          dynamicSamplingContext: {
            environment: 'production',
            trace_id: expect.any(String),
            transaction: 'test',
            sampled: 'true',
          },
        },
        transaction_info: { source: 'custom' },
      }),
      { event_id: expect.any(String) },
      scope,
    );
    expect(res).toBe('mocked');
  });
});

describe('startTranscation', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('creates a NodeExperimentalTransaction', () => {
    const client = new TestClient(getDefaultTestClientOptions());
    const hub = getCurrentHub();
    setCurrentClient(client);
    client.init();

    const transaction = startTransaction(hub, { name: 'test' });

    expect(transaction).toBeInstanceOf(OpenTelemetryTransaction);
    expect(transaction['_sampled']).toBe(undefined);
    // eslint-disable-next-line deprecation/deprecation
    expect(transaction.spanRecorder).toBeDefined();
    // eslint-disable-next-line deprecation/deprecation
    expect(transaction.spanRecorder?.spans).toHaveLength(1);
    // eslint-disable-next-line deprecation/deprecation
    expect(transaction.metadata).toEqual({
      source: 'custom',
      spanMetadata: {},
    });

    expect(spanToJSON(transaction)).toEqual(
      expect.objectContaining({
        origin: 'manual',
        span_id: expect.any(String),
        start_timestamp: expect.any(Number),
        trace_id: expect.any(String),
      }),
    );
  });

  it('allows to pass data to transaction', () => {
    const client = new TestClient(getDefaultTestClientOptions());
    const hub = getCurrentHub();
    setCurrentClient(client);
    client.init();

    const transaction = startTransaction(hub, {
      name: 'test',
      startTimestamp: 1234,
      spanId: 'span1',
      traceId: 'trace1',
    });

    expect(transaction).toBeInstanceOf(OpenTelemetryTransaction);
    // eslint-disable-next-line deprecation/deprecation
    expect(transaction.metadata).toEqual({
      source: 'custom',
      spanMetadata: {},
    });

    expect(spanToJSON(transaction)).toEqual(
      expect.objectContaining({
        origin: 'manual',
        span_id: 'span1',
        start_timestamp: 1234,
        trace_id: 'trace1',
      }),
    );
  });
});

import * as SentryNode from '@sentry/node';
import * as AWS from 'aws-sdk';
import * as nock from 'nock';

import { SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN } from '@sentry/core';
import { AWSServices } from '../src/awsservices';

describe('AWSServices', () => {
  beforeAll(() => {
    new AWSServices().setupOnce();
  });
  afterEach(() => {
    // @ts-expect-error see "Why @ts-expect-error" note
    SentryNode.resetMocks();
  });
  afterAll(() => {
    nock.restore();
  });

  describe('S3 tracing', () => {
    const s3 = new AWS.S3({ accessKeyId: '-', secretAccessKey: '-' });

    test('getObject', async () => {
      nock('https://foo.s3.amazonaws.com').get('/bar').reply(200, 'contents');
      const data = await s3.getObject({ Bucket: 'foo', Key: 'bar' }).promise();
      expect(data.Body?.toString('utf-8')).toEqual('contents');
      expect(SentryNode.startInactiveSpan).toBeCalledWith({
        op: 'http.client',
        attributes: {
          [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: 'auto.http.serverless',
        },
        name: 'aws.s3.getObject foo',
      });
      // @ts-expect-error see "Why @ts-expect-error" note
      expect(SentryNode.fakeSpan.end).toBeCalled();
    });

    test('getObject with callback', done => {
      expect.assertions(3);
      nock('https://foo.s3.amazonaws.com').get('/bar').reply(200, 'contents');
      s3.getObject({ Bucket: 'foo', Key: 'bar' }, (err, data) => {
        expect(err).toBeNull();
        expect(data.Body?.toString('utf-8')).toEqual('contents');
        done();
      });
      expect(SentryNode.startInactiveSpan).toBeCalledWith({
        op: 'http.client',
        name: 'aws.s3.getObject foo',
        attributes: {
          [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: 'auto.http.serverless',
        },
      });
    });
  });

  describe('Lambda', () => {
    const lambda = new AWS.Lambda({ accessKeyId: '-', secretAccessKey: '-', region: 'eu-north-1' });

    test('invoke', async () => {
      nock('https://lambda.eu-north-1.amazonaws.com').post('/2015-03-31/functions/foo/invocations').reply(201, 'reply');
      const data = await lambda.invoke({ FunctionName: 'foo' }).promise();
      expect(data.Payload?.toString('utf-8')).toEqual('reply');
      expect(SentryNode.startInactiveSpan).toBeCalledWith({
        op: 'http.client',
        attributes: {
          [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: 'auto.http.serverless',
        },
        name: 'aws.lambda.invoke foo',
      });
    });
  });
});

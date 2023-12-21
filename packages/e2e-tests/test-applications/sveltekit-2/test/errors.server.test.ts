import { expect, test } from '@playwright/test';
import { waitForError } from '../event-proxy-server';

test.describe('capturing server side errors', () => {
  test('should capture universal load error', async ({ page }) => {
    const errorEventPromise = waitForError('sveltekit-2', errorEvent => {
      return errorEvent?.exception?.values?.[0]?.value === 'Universal Load Error (server)';
    });

    await page.goto('/universal-load-error');

    const errorEvent = await errorEventPromise;
    const errorEventFrames = errorEvent.exception?.values?.[0]?.stacktrace?.frames;

    expect(errorEventFrames?.[errorEventFrames?.length - 1]).toEqual(
      expect.objectContaining({
        function: 'load$1',
        lineno: 3,
        in_app: true,
      }),
    );

    expect(errorEvent.tags).toMatchObject({ runtime: 'node' });
  });

  test('should capture server load error', async ({ page }) => {
    const errorEventPromise = waitForError('sveltekit-2', errorEvent => {
      return errorEvent?.exception?.values?.[0]?.value === 'Server Load Error';
    });

    await page.goto('/server-load-error');

    const errorEvent = await errorEventPromise;
    const errorEventFrames = errorEvent.exception?.values?.[0]?.stacktrace?.frames;

    expect(errorEventFrames?.[errorEventFrames?.length - 1]).toEqual(
      expect.objectContaining({
        function: 'load$1',
        lineno: 3,
        in_app: true,
      }),
    );

    expect(errorEvent.tags).toMatchObject({ runtime: 'node' });
  });

  test('should capture server route (GET) error', async ({ page }) => {
    const errorEventPromise = waitForError('sveltekit-2', errorEvent => {
      return errorEvent?.exception?.values?.[0]?.value === 'Server Route Error';
    });

    await page.goto('/server-route-error');

    const errorEvent = await errorEventPromise;
    const errorEventFrames = errorEvent.exception?.values?.[0]?.stacktrace?.frames;

    expect(errorEventFrames?.[errorEventFrames?.length - 1]).toEqual(
      expect.objectContaining({
        filename: 'app:///_server.ts.js',
        function: 'GET',
        lineno: 2,
        in_app: true,
      }),
    );

    expect(errorEvent.tags).toMatchObject({
      runtime: 'node',
      transaction: 'GET /server-route-error',
    });
  });
});

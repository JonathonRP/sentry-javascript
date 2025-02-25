import * as Sentry from '@sentry/nextjs';
// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // eslint-disable-next-line deprecation/deprecation
  const transaction = Sentry.startTransaction({ name: 'test-transaction', op: 'e2e-test' });
  // eslint-disable-next-line deprecation/deprecation
  Sentry.getCurrentScope().setSpan(transaction);

  // eslint-disable-next-line deprecation/deprecation
  const span = transaction.startChild();

  span.end();
  transaction.end();

  Sentry.flush().then(() => {
    res.status(200).json({
      transactionIds: global.transactionIds,
    });
  });
}

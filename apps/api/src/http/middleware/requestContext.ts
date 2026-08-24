import { CORRELATION_ID_HEADER } from '@claimdesk/contracts';
import type { RequestHandler } from 'express';

import { newCorrelationId, newRequestId, runWithContext } from '../../platform/util/index.js';

/**
 * Establishes the async request context and echoes the correlation id back so
 * a client can quote it in a bug report.
 *
 * An inbound correlation id is honoured, which is how a single id spans
 * mobile -> API -> worker -> integration.
 */
export const requestContext: RequestHandler = (req, res, next) => {
  const inbound = req.header(CORRELATION_ID_HEADER);
  const context = {
    requestId: newRequestId(),
    correlationId: inbound && inbound.length <= 128 ? inbound : newCorrelationId(),
  };

  res.setHeader(CORRELATION_ID_HEADER, context.correlationId);
  res.setHeader('x-request-id', context.requestId);

  runWithContext(context, () => {
    next();
  });
};

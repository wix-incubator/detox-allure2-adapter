import type { OnErrorHandler } from '../types';

export function createErrorHandler(onError: OnErrorHandler) {
  if (onError === 'throw') {
    return throwError;
  } else if (onError === 'ignore') {
    return ignoreError;
  } else {
    return onError;
  }
}

function throwError(error: Error) {
  throw error;
}

function ignoreError(_error: Error) {
  // Do nothing
}

import type { StepDescription } from '../../types';
import type { ExpectationInvocation } from '../detox-payload';
import { formatPredicate } from './predicate-formatters';
import { concat, msg, percent, truncate } from './utils';

const formatExpectationVerb = (invocation: ExpectationInvocation): string => {
  const hasNot = invocation.modifiers?.includes('not');
  const verb = invocation.expectation
    .replace(/([A-Z])/g, ' $1')
    .toLowerCase()
    .trim();
  return `${hasNot ? 'not ' : ''}${verb}`;
};

const formatExpectationParams = (invocation: ExpectationInvocation): StepDescription | null => {
  const [expected] = invocation.params || [];

  switch (invocation.expectation) {
    case 'toBeVisible': {
      return typeof expected === 'number' ? msg(`by ${percent(expected)}`, { expected }) : null;
    }

    default: {
      return expected == null ? null : msg(`${truncate(expected)}`, { expected });
    }
  }
};

export const formatWhileCondition = (
  expectation?: ExpectationInvocation,
): StepDescription | null => {
  return expectation
    ? concat(
        'while waiting for',
        formatPredicate(expectation.predicate, 'while'),
        formatExpectationVerb(expectation),
      )
    : null;
};

export const formatExpectation = (invocation: ExpectationInvocation): StepDescription => {
  return concat(
    'Expect',
    formatPredicate(invocation.predicate),
    formatExpectationVerb(invocation),
    formatExpectationParams(invocation),
  );
};

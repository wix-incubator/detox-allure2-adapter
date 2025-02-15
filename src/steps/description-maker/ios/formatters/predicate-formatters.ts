import type { StepArgs, StepDescription } from '../../types';
import type { Predicate } from '../detox-payload';
import { concat, truncate } from './utils';

function join(a: string, b: string): string {
  return a && b ? `${a}_${b}` : a || b;
}

function formatBasePredicate(predicate: Predicate, prefix = ''): StepDescription {
  const { type, value, atIndex, isRegex } = predicate;
  const _ = (name: string) => join(prefix, name);

  const index$ = atIndex == null ? '' : `[${atIndex}]`;
  const args: StepArgs = { [_(type)]: value };
  if (index$) {
    args[_('index')] = atIndex;
  }

  const value$ = truncate(value);

  // Handle regex predicates
  if (isRegex) {
    return {
      message: `[${type}] ~ ${value$}` + index$,
      args,
    };
  }

  // Handle text predicates
  if (type === 'label' || type === 'accessibilityLabel' || type === 'text') {
    return {
      message: `"${value$}"${index$ ? ' ' : ''}${index$}`,
      args,
    };
  }

  // Handle traits predicates
  if (type === 'traits') {
    return {
      message: `[${value$}]${index$}`,
      args,
    };
  }

  if (type === 'id') {
    return {
      message: `#${value$}${index$}`,
      args,
    };
  }

  return {
    message: `[${type}] = ${value$}${index$}`,
    args,
  };
}

export const formatPredicate = (predicate: Predicate, prefix = ''): StepDescription => {
  const { predicates, ancestor, descendant } = predicate;

  // Handle compound predicates
  if (predicates) {
    const formattedPredicates = predicates.map((p) => formatPredicate(p));
    return {
      message: `(${formattedPredicates.map((p) => p.message).join(' AND ')})`,
      args: formattedPredicates.reduce((acc, p) => ({ ...acc, ...p.args }), {}),
    };
  }

  // Handle ancestor/descendant relationships
  if (ancestor) {
    return concat(
      formatBasePredicate(predicate),
      'inside',
      formatPredicate(ancestor, join(prefix, 'ancestor')),
    );
  }

  if (descendant) {
    return concat(
      formatBasePredicate(predicate),
      'containing',
      formatPredicate(descendant, join(prefix, 'descendant')),
    );
  }

  return formatBasePredicate(predicate, prefix);
};

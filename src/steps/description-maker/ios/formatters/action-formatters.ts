import type { StepDescription } from '../../types';
import type { ActionInvocation } from '../detox-payload';
import { formatWhileCondition } from './expectation-formatters';
import { formatPredicate as p } from './predicate-formatters';
import { concat, msg } from './utils';

type ActionFormatter<T extends ActionInvocation> = (action: T) => StepDescription;

type ActionFormatterMap = Partial<{
  [K in ActionInvocation['action']]: ActionFormatter<Extract<ActionInvocation, { action: K }>>;
}>;

const actionFormatters: ActionFormatterMap = {
  tap: ({ predicate }) => concat('Tap', p(predicate)),

  longPress: ({ predicate, params: [duration] }) =>
    concat(msg('Long press', { duration }), p(predicate)),

  scroll: ({ predicate, params: [distance, direction], while: whileCondition }) => {
    return concat(
      msg(`Scroll ${direction} on`, { direction, distance }),
      p(predicate),
      formatWhileCondition(whileCondition),
    );
  },

  scrollTo: ({ predicate, params: [edge, normalizedX, normalizedY] }) =>
    concat(
      msg(`Scroll to ${edge}`, {
        edge,
        ...(normalizedX !== undefined && { x: normalizedX, y: normalizedY }),
      }),
      'on',
      p(predicate),
    ),

  replaceText: ({ predicate, params: [text] }) =>
    concat(msg('Replace text in', { text }), p(predicate)),

  typeText: ({ predicate, params: [text] }) => concat(msg('Type text in', { text }), p(predicate)),

  accessibilityAction: ({ predicate, params: [action] }) =>
    concat(msg(`Activate a11y "${action}" on`, { action }), p(predicate)),

  setDatePickerDate: ({ predicate, params: [date, format] }) =>
    concat('Set date picker', p(predicate), msg(`${date}`, { date, format })),
};

// Main entry point that routes to the correct formatter based on action type
export const formatAction = (action: ActionInvocation): StepDescription | null => {
  const formatter = actionFormatters[action.action];
  return formatter ? formatter(action as any) : null;
};

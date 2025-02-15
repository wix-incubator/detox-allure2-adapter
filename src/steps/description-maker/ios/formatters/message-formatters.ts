import type { StepDescription } from '../../types';
import type { DetoxMessage, Invocation } from '../detox-payload';
import { formatAction } from './action-formatters';
import { formatExpectation } from './expectation-formatters';
import { msg } from './utils';

type MessageFormatter<T extends DetoxMessage> = (message: T) => StepDescription | null;

type MessageFormatterMap = {
  [K in DetoxMessage['type']]: MessageFormatter<Extract<DetoxMessage, { type: K }>>;
};

const messageFormatters: MessageFormatterMap = {
  invoke: (message) => {
    const invocation = message.params;
    return formatInvocation(invocation);
  },
  deliverPayload: ({ params: { url, delayPayload } }) =>
    msg('Deliver payload', { url, delayPayload }),
};

const formatInvocation = (invocation: Invocation): StepDescription | null => {
  switch (invocation.type) {
    case 'action': {
      return formatAction(invocation);
    }
    case 'expectation': {
      return formatExpectation(invocation);
    }
    default: {
      return null;
    }
  }
};

export const formatMessage = (message: DetoxMessage): StepDescription | null => {
  const formatter = messageFormatters[message.type];
  return formatter ? formatter(message as any) : null;
};

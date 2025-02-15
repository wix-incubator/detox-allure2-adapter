export type DetoxMessage = InvokeMessage | DeliverPayloadMessage;

//#region Predicates
export type PredicateType =
  | 'id'
  | 'text'
  | 'label'
  | 'traits'
  | 'accessibilityLabel'
  | 'accessibilityIdentifier';

export interface Predicate {
  type: PredicateType | 'and';
  value: string | string[] | number | boolean;
  isRegex?: boolean;
  atIndex?: number;
  predicates?: Predicate[];
  ancestor?: Predicate;
  descendant?: Predicate;
  targetElement?: {
    predicate: Predicate;
  };
}
//#endregion Predicates

//#region Detox Base Types
export type DetoxAction =
  | 'tap'
  | 'longPress'
  | 'scroll'
  | 'scrollTo'
  | 'replaceText'
  | 'typeText'
  | 'accessibilityAction'
  | 'setDatePickerDate';

export type DetoxExpectation =
  | 'toBeVisible'
  | 'toExist'
  | 'toHaveText'
  | 'toHaveLabel'
  | 'toBeEnabled'
  | 'toBeFocused'
  | 'toBeDisabled';

export type ExpectationModifier = 'not';

export type ScrollDirection = 'up' | 'down' | 'left' | 'right';
export type ScrollEdge = 'top' | 'bottom' | 'left' | 'right';
//#endregion Detox Base Types

//#region Base Invocation
interface BaseInvocation {
  predicate: Predicate;
  timeout?: number;
  atIndex?: number;
  params?: readonly unknown[];
}
//#endregion Base Invocation

//#region Invocations
export interface ExpectationInvocation extends BaseInvocation {
  type: 'expectation';
  expectation: DetoxExpectation;
  modifiers?: ExpectationModifier[];
}

export interface BaseActionInvocation extends BaseInvocation {
  type: 'action';
  action: DetoxAction;
  while?: ExpectationInvocation;
}
//#endregion Invocations

//#region Action Invocations
export interface TapAction extends BaseActionInvocation {
  action: 'tap';
}

export interface LongPressAction extends BaseActionInvocation {
  action: 'longPress';
  params: LongPressParams;
}

export interface ScrollAction extends BaseActionInvocation {
  action: 'scroll';
  params: ScrollParams;
}

export interface ScrollToAction extends BaseActionInvocation {
  action: 'scrollTo';
  params: ScrollToParams;
}

export interface ReplaceTextAction extends BaseActionInvocation {
  action: 'replaceText';
  params: TextParams;
}

export interface TypeTextAction extends BaseActionInvocation {
  action: 'typeText';
  params: TextParams;
}

export interface AccessibilityAction extends BaseActionInvocation {
  action: 'accessibilityAction';
  params: AccessibilityActionParams;
}

export interface SetDatePickerAction extends BaseActionInvocation {
  action: 'setDatePickerDate';
  params: DatePickerParams;
}
//#endregion Action Invocations

//#region Invocation Union Types
export type ActionInvocation =
  | TapAction
  | LongPressAction
  | ScrollAction
  | ScrollToAction
  | ReplaceTextAction
  | TypeTextAction
  | AccessibilityAction
  | SetDatePickerAction;

export type Invocation = ActionInvocation | ExpectationInvocation;
//#endregion Invocation Union Types

//#region Action Params
export type ScrollParams = readonly [distance: number, direction: ScrollDirection];
export type ScrollToParams = readonly [
  edge: ScrollEdge,
  normalizedX?: number,
  normalizedY?: number,
];
export type LongPressParams = readonly [duration: number];
export type TextParams = readonly [text: string];
export type DatePickerParams = readonly [date: string, format?: string];
export type AccessibilityActionParams = readonly [action: string];

export type ActionParams =
  | ScrollParams
  | ScrollToParams
  | LongPressParams
  | TextParams
  | DatePickerParams
  | AccessibilityActionParams;
//#endregion Action Params

//#region Messages
export interface InvokeMessage {
  type: 'invoke';
  params: Invocation;
}

export interface DeliverPayloadMessage {
  type: 'deliverPayload';
  params: DeliverPayloadParams;
}

export interface DeliverPayloadParams {
  url: string;
  delayPayload?: boolean;
  viewHierarchyURL?: string;
  detoxUserActivityDataURL?: string;
  detoxUserNotificationDataURL?: string;
  newInstance?: boolean;
  shouldInjectTestIds?: boolean;
}
//#endregion Messages

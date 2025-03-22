// eslint-disable-next-line import/no-internal-modules
import _mergedTraces from './__fixtures__/merged-detox-traces.json';
import { androidDescriptionMaker } from './android-description-maker';

const mergedTraces = _mergedTraces as any[];

describe('Android description maker', () => {
  test('should handle basic tap by test ID', () => {
    const payload = {
      type: 'invoke',
      params: {
        target: { type: 'Class', value: 'com.wix.detox.espresso.EspressoDetox' },
        method: 'perform',
        args: [
          {
            type: 'Invocation',
            value: {
              target: { type: 'Class', value: 'com.wix.detox.espresso.DetoxMatcher' },
              method: 'matcherForTestId',
              args: ['SimpleButton', { type: 'Boolean', value: false }],
            },
          },
          {
            type: 'Invocation',
            value: {
              target: { type: 'Class', value: 'com.wix.detox.espresso.DetoxViewActions' },
              method: 'click',
              args: [],
            },
          },
        ],
      },
    };

    const description = androidDescriptionMaker(payload);
    expect(description).toEqual({
      message: 'Click on #SimpleButton',
      args: { id: 'SimpleButton' },
    });
  });

  const testCases = mergedTraces.map((trace, index) => [index, trace]);
  test.each(testCases)('should process trace %i: %j', (_index, trace) => {
    // if (_index === 0) { debugger; }
    expect(androidDescriptionMaker(trace)).toMatchSnapshot();
  });

  test.each([
    ['string', 'not an object'],
    ['number', 42],
    ['null', null],
    ['undefined', undefined],
    ['empty object', {}],
    ['unknown type', { type: 'unknown' }],
  ])('should ignore invalid invocation: %s', (_label, invocation) => {
    expect(androidDescriptionMaker(invocation)).toBeNull();
  });

  test('should ignore invocation without target', () => {
    const payload = {
      type: 'invoke',
      params: {
        method: 'matcherForTestId',
      },
    };
    expect(androidDescriptionMaker(payload)).toBeNull();
  });

  it('should ignore invocation without params', () => {
    const payload: any = {
      type: 'invoke',
      params: {},
    };
    expect(androidDescriptionMaker(payload)).toBeNull();

    delete payload.params;
    expect(androidDescriptionMaker(payload)).toBeNull();
  });

  test('should handle unknown class in registry', () => {
    const payload = {
      type: 'invoke',
      params: {
        target: { type: 'Class', value: 'com.wix.detox.NonExistentClass' },
        method: 'someMethod',
        args: [],
      },
    };
    expect(androidDescriptionMaker(payload)).toBeNull();
  });

  test('should handle non-existent method on valid class', () => {
    const payload = {
      type: 'invoke',
      params: {
        target: { type: 'Class', value: 'com.wix.detox.espresso.DetoxMatcher' },
        method: 'nonExistentMethod',
        args: [],
      },
    };
    expect(androidDescriptionMaker(payload)).toBeNull();
  });

  test('should handle malformed class object', () => {
    const payload = {
      type: 'invoke',
      params: {
        target: { type: 'NotAClass', value: 'something' },
        method: 'method',
        args: [],
      },
    };
    expect(androidDescriptionMaker(payload)).toBeNull();
  });

  test('should handle null target in invocation', () => {
    const payload = {
      type: 'invoke',
      params: {
        target: null,
        method: 'method',
        args: [],
      },
    };
    expect(androidDescriptionMaker(payload)).toBeNull();
  });

  test('should handle deeply nested null values', () => {
    const payload = {
      type: 'invoke',
      params: {
        target: {
          type: 'Invocation',
          value: {
            target: null,
            method: 'method',
            args: [],
          },
        },
        method: 'method',
        args: [],
      },
    };
    expect(androidDescriptionMaker(payload)).toBeNull();
  });

  test('should handle malformed primitive type object', () => {
    const payload = {
      type: 'invoke',
      params: {
        target: { type: 'Class', value: 'com.wix.detox.espresso.DetoxMatcher' },
        method: 'matcherForTestId',
        args: [
          { type: 'MalformedType', value: 'test' },
          { type: 'Boolean', value: false },
        ],
      },
    };

    expect(androidDescriptionMaker(payload)).toEqual({
      message: '##ERROR!',
      args: { id: '#ERROR!' },
    });
  });

  test('should handle array with null values', () => {
    const payload = {
      type: 'invoke',
      params: {
        target: { type: 'Class', value: 'com.wix.detox.espresso.EspressoDetox' },
        method: 'perform',
        args: [
          {
            type: 'Invocation',
            value: {
              target: { type: 'Class', value: 'com.wix.detox.espresso.DetoxMatcher' },
              method: 'matcherForTestId',
              args: [],
            },
          },
          {
            type: 'Invocation',
            value: {
              target: { type: 'Class', value: 'unknownClass' },
              method: 'click',
              args: [],
            },
          },
        ],
      },
    };
    expect(androidDescriptionMaker(payload)).toBeNull();
  });

  test('should handle unknown message type', () => {
    const payload = {
      type: 'unknownType',
      params: {},
    };
    expect(androidDescriptionMaker(payload)).toBeNull();
  });

  test('should handle circular references', () => {
    const circular: any = {
      type: 'invoke',
      params: {
        target: { type: 'Class', value: 'com.wix.detox.espresso.DetoxMatcher' },
        method: 'method',
        args: [],
      },
    };
    circular.params.args.push(circular);
    expect(androidDescriptionMaker(circular)).toBeNull();
  });

  test('should handle empty invocation value', () => {
    const payload = {
      type: 'invoke',
      params: {
        target: {
          type: 'Invocation',
          value: {},
        },
        method: 'method',
        args: [],
      },
    };
    expect(androidDescriptionMaker(payload)).toBeNull();
  });

  test('should handle malformed matcher chain', () => {
    const payload = {
      type: 'invoke',
      params: {
        target: { type: 'Class', value: 'com.wix.detox.espresso.DetoxMatcher' },
        method: 'matcherWithAncestor',
        args: [
          {
            type: 'Invocation',
            value: {
              target: null,
              method: 'method',
              args: [],
            },
          },
          null,
        ],
      },
    };
    expect(androidDescriptionMaker(payload)).toEqual({
      message: 'with ancestor',
      args: null,
    });
  });
});

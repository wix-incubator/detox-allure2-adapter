import fs from 'fs';
import path from 'path';
import { iosDescriptionMaker } from './ios-description-maker';

const loadFixture = (name: string) =>
  JSON.parse(fs.readFileSync(path.join(__dirname, '__fixtures__', `${name}.json`), 'utf8'));

const formatPayloadAndDescription = (payload: any) => {
  const lines: string[] = [];

  // Always show the payload
  lines.push(`> ${JSON.stringify(payload)}`);

  // If we have a description, show message and args
  const description = iosDescriptionMaker(payload);
  if (description) {
    lines.push(`< ${description.message}`, `+ ${JSON.stringify(description.args)}`);
  }

  // Add empty line as separator
  lines.push('');

  return lines.join('\n');
};

const parseJsonLine = (line: string) => {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
};

describe('iOS description maker', () => {
  test.each([
    ['tap-basic-button', 'Tap #SimpleButton', { id: 'SimpleButton' }],
    ['tap-indexed-button', 'Tap #IndexedButton[1]', { id: 'IndexedButton', index: 1 }],
    ['long-press-button', 'Long press #LongPressButton', { duration: 1000, id: 'LongPressButton' }],
    [
      'scroll-vertical',
      'Scroll down on #ScrollView',
      { direction: 'down', distance: 100, id: 'ScrollView' },
    ],
    ['type-text-input', 'Type text in #TextInput', { id: 'TextInput', text: 'Hello World' }],
    [
      'scroll-to-with-coordinates',
      'Scroll to bottom on #ScrollView161',
      { edge: 'bottom', x: 0.2, y: 0.4, id: 'ScrollView161' },
    ],
    [
      'scroll-to-without-coordinates',
      'Scroll to top on #ScrollView161',
      { edge: 'top', id: 'ScrollView161' },
    ],
    ['tap-compound-and', 'Tap (#button && "Click me")', { id: 'button', label: 'Click me' }],
    ['tap-with-traits', 'Tap [button,selected]', { traits: ['button', 'selected'] }],
    [
      'tap-with-ancestor',
      'Tap (#childButton inside #parentView)',
      { id: 'childButton', ancestor_id: 'parentView' },
    ],
    [
      'scroll-with-while',
      'Scroll down on #ScrollView while waiting for "Text5" to be visible',
      { direction: 'down', distance: 50, id: 'ScrollView', while_text: 'Text5' },
    ],
    [
      'swipe-action',
      'Swipe down on "Index"',
      { text: 'Index', direction: 'down', speed: 'fast', amount: 0.7 },
    ],
    [
      'date-picker-set-column',
      'Set #datePicker column [1] to: 6',
      { id: 'datePicker', column: 1, value: '6' },
    ],
    ['web-scroll-to-view', 'WebView: Scroll to #bottomParagraph', { web_id: 'bottomParagraph' }],
    ['multi-tap', 'Tap 3 times on #container', { id: 'container', count: 3 }],
  ])('should handle %s selector', (fixture, message, args) => {
    const description = iosDescriptionMaker(loadFixture(fixture));
    expect(description).toEqual({ message, args });
  });

  test('should process everything.jsonl fixture', () => {
    // Read and parse the JSONL file
    const fileContent = fs.readFileSync(
      path.join(__dirname, '__fixtures__', 'everything.jsonl'),
      'utf8',
    );
    const lines = fileContent.split('\n').map(parseJsonLine).filter(Boolean);

    // Format each payload and join them together
    const results = lines.map(formatPayloadAndDescription).join('\n');

    expect(results).toMatchSnapshot();
  });

  test('should not fail on broken.jsonl fixture', () => {
    // Read and parse the JSONL file
    const fileContent = fs.readFileSync(
      path.join(__dirname, '__fixtures__', 'broken.jsonl'),
      'utf8',
    );
    const lines = fileContent.split('\n').map(parseJsonLine).filter(Boolean);

    // Format each payload and join them together
    const results = lines.map(formatPayloadAndDescription).join('\n');

    expect(results).toMatchSnapshot();
  });
});

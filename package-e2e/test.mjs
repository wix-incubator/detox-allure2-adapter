import assert from 'assert';
import listener from 'detox-allure2-adapter';
import DetoxAllurePathBuilder from 'detox-allure2-adapter/path-builder';
import presetAllure from 'detox-allure2-adapter/preset-allure';
import presetDetox from 'detox-allure2-adapter/preset-detox';

assert(typeof listener === 'function', 'detox-allure2-adapter should have a function as its default export');

assert(typeof DetoxAllurePathBuilder === 'function', 'detox-allure2-adapter/path-builder should have a class as its default export');
assert(new DetoxAllurePathBuilder instanceof DetoxAllurePathBuilder, 'detox-allure2-adapter/path-builder should have a class as its default export');

assert(typeof presetAllure === 'object', 'detox-allure2-adapter/preset-allure should have an object as its default export');
assert(typeof presetAllure.testCase === 'object', 'detox-allure2-adapter/preset-allure should have an object as its default export');

assert(typeof presetDetox === 'object', 'detox-allure2-adapter/preset-detox should have an object as its default export');
assert(typeof presetDetox.artifacts === 'object', 'detox-allure2-adapter/preset-detox should have an object as its default export');

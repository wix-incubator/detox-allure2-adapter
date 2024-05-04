const assert = require('assert');
const listener = require('detox-allure2-adapter');
assert(typeof listener === 'function', 'detox-allure2-adapter should have a function as its default export');

const DetoxAllurePathBuilder = require('detox-allure2-adapter/path-builder');
assert(typeof DetoxAllurePathBuilder === 'function', 'detox-allure2-adapter/path-builder should have a class as its default export');
assert(new DetoxAllurePathBuilder instanceof DetoxAllurePathBuilder, 'detox-allure2-adapter/path-builder should have a class as its default export');

const presetAllure = require('detox-allure2-adapter/preset-allure');
assert(typeof presetAllure === 'object', 'detox-allure2-adapter/preset-allure should have an object as its default export');
assert(typeof presetAllure.testCase === 'object', 'detox-allure2-adapter/preset-allure should have an object as its default export');

const presetDetox = require('detox-allure2-adapter/preset-detox');
assert(typeof presetDetox === 'object', 'detox-allure2-adapter/preset-detox should have an object as its default export');
assert(typeof presetDetox.artifacts === 'object', 'detox-allure2-adapter/preset-detox should have an object as its default export');

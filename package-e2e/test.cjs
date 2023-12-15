const assert = require('assert');
const listener = require('detox-allure2-adapter');
assert(typeof listener === 'function', 'detox-allure2-adapter should have a function as its default export');

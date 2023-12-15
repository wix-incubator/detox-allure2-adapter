import assert from 'assert';
import listener from 'detox-allure2-adapter';

assert(typeof listener === 'function', 'detox-allure2-adapter should have a function as its default export');

'use strict';

const hasBigInt = !!global.BigInt;

module.exports = {
    assert: 'code',
    globals: hasBigInt ? 'BigUint64Array,BigInt64Array,BigInt' : '',
    flat: true
};

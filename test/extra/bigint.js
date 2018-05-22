'use strict';

// Load modules

const Code = require('code');
const Granola = require('../..');
const Helper = require('./helper');


// Declare internals

const internals = {};


exports.suite = (lab) => {

    // Test shortcuts

    const { describe, it } = lab;
    const { expect } = Code;

    describe('BigInt', () => {

        const validate = Helper.createValidator(expect);

        it('works for small and big values', () => {

            validate(0n);
            validate(10n);
            validate(-10n);
            validate(BigInt(Number.MAX_SAFE_INTEGER) * 2n);
            validate(BigInt(Number.MIN_SAFE_INTEGER) * 2n);
            validate((1n << 100n) + 1n);
            validate((-1n << 100n) + 1n);
        });

        it('can be used as key for a map', () => {

            validate(new Map([[1n, 'one']]));
        });

        it('parser also works with booleans', () => {

            const result = Granola.parse(Helper.faker('n', 'true'));
            expect(typeof result.obj).to.equal('bigint');
            expect(result.obj).to.equal(1n);
        });

        it('parser throws on bad input', () => {

            expect(() => Granola.parse(Helper.faker('n', '"huh?"'))).to.throw(SyntaxError, 'Cannot convert huh? to a BigInt');
            expect(() => Granola.parse(Helper.faker('n', '0.5'))).to.throw(RangeError, /not a safe integer/);
        });
    });
}

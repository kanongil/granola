'use strict';

// Load modules

const Code = require('code');
const Granola = require('..');
const Helper = require('./extra/helper');
const Lab = require('lab');


// Declare internals

const internals = {
    hasBigInt: !!global.BigInt
};


// Test shortcuts

const lab = exports.lab = Lab.script();
const { describe, it } = lab;
const { expect } = Code;


describe('stringify()', () => {

    const validate = Helper.createValidator(expect, { direct: true });

    it('encodes regular json', () => {

        validate('hello world');
        validate(123);
        validate(true);
        validate(null);
        validate([]);
        validate(['hello world', 123, true, null, [], {}]);
        validate({});
        validate({ hello: 'world' });
    });

    it('throws on extended input without a containing object', () => {

        expect(() => validate(new Date())).to.throw(TypeError, 'stringify() input must convert to an \"object\" when extended types are encoded.');
        expect(() => validate([new Date()])).to.throw(TypeError, 'stringify() input must convert to an \"object\" when extended types are encoded.');
        expect(() => validate({ a: new Date() })).to.not.throw();
    });

    it('throws on top-level "$x" property', () => {

        expect(() => validate({ $x: true })).to.throw(TypeError, 'stringify() input object cannot have a top-level \"$x\" property.');
    });

    it('handles "$x" property when not at top level', () => {

        expect(() => validate({ a: { $x: true } })).to.not.throw();
    });
});

describe('parse()', () => {

    it('decodes as regular json if "$x" is not an object', () => {

        expect(Granola.parse('{"$x":"hi"}')).to.equal({ $x: 'hi' });
        expect(Granola.parse('{"$x":true}')).to.equal({ $x: true });
        expect(Granola.parse('{"$x":null}')).to.equal({ $x: null });
        expect(Granola.parse('{"$x":[1,2,3]}')).to.equal({ $x: [1, 2, 3] });
        expect(Granola.parse('{"$x":123}')).to.equal({ $x: 123 });
    });

    it('ignores missing references', () => {

        expect(Granola.parse('{"$x":{"D":[["a"]]},"b":10000}')).to.equal({ b: 10000 });
        expect(Granola.parse('{"$x":{"B":[["a","b","c"]]},"b":10000}')).to.equal({ b: 10000 });
    });

    it('throws on multiple definitions for same key', () => {

        expect(() => Granola.parse('{"$x":{"D":[["a"]],"B":[["a"]]},"a":"1000"}')).to.throw();
    });

    it('handles unknown types', () => {

        expect(Granola.parse(Helper.faker('!', 'true'))).to.equal({ obj: undefined });
    });

    it('ignores types without an array', () => {

        expect(Granola.parse('{"$x":{"D":{}},"a":"1000"}')).to.equal({ a: '1000' });
        expect(Granola.parse('{"$x":{"S":{}},"a":"1000"}')).to.equal({ a: '1000' });
    });
});

describe('Date', () => {

    const validate = Helper.createValidator(expect);

    it('works', () => {

        validate(new Date());
        validate(new Date(0));
        validate(new Date('huh?'), null);
    });

    it('parser also works with numbers', () => {

        const result = Granola.parse(Helper.faker('D', '1000000'));
        expect(result.obj).to.instanceof(Date);
        expect(+result.obj).to.equal(1000000);
    });

    it('parser creates invalid date on bad input', () => {

        const result = Granola.parse(Helper.faker('D', '"huh?"'));
        expect(result.obj).to.instanceof(Date);
        expect(+result.obj).to.equal(NaN);
        // TODO: throw SyntaxError instead??
    });
});

describe('Set', () => {

    const validate = Helper.createValidator(expect);

    it('works', () => {

        validate(new Set());
        validate(new Set(['hello world', 123, true, null, [], {}, new Date(), new Set(), new Map()]));
    });

    it('parser also works with strings', () => {

        const result = Granola.parse(Helper.faker('S', '"abc"'));
        expect(result.obj).to.instanceof(Set);
        expect(result.obj).to.equal(new Set('abc'));
    });

    it('parser creates invalid date on bad input', () => {

        expect(() => Granola.parse(Helper.faker('S', '0'))).to.throw(TypeError);
        expect(() => Granola.parse(Helper.faker('S', '{}'))).to.throw(TypeError);
    });
});

describe('Map', () => {

    const validate = Helper.createValidator(expect);

    it('works', () => {

        validate(new Map());
        validate(new Map([[1, 'one'], [2, 'two']]));
        validate(new Map([[1, new Map([[1, 'one'], [2, 'two']])]]));
    });

    it('parser also works with strings', () => {

        const result = Granola.parse(Helper.faker('S', '"abc"'));
        expect(result.obj).to.instanceof(Set);
        expect(result.obj).to.equal(new Set('abc'));
    });

    it('parser throws on bad input', () => {

        expect(() => Granola.parse(Helper.faker('S', '0'))).to.throw(TypeError);
        expect(() => Granola.parse(Helper.faker('S', '{}'))).to.throw(TypeError);
    });
});

describe('Buffer', () => {

    const validate = Helper.createValidator(expect);

    it('works', () => {

        validate(Buffer.alloc(0));
        validate(Buffer.alloc(10));
        validate(Buffer.from('hello'));
    });

    it('parser also works with arrays', () => {

        const result = Granola.parse(Helper.faker('B', '[0,1,2]'));
        expect(result.obj).to.instanceof(Buffer);
        expect(result.obj).to.equal(Buffer.from([0, 1, 2]));
    });

    it('parser throws on bad input', () => {

        expect(() => Granola.parse(Helper.faker('B', '0'))).to.throw(TypeError);
        expect(() => Granola.parse(Helper.faker('B', '{}'))).to.throw(TypeError);
        expect(() => Granola.parse(Helper.faker('B', '"hello!"'))).to.throw(SyntaxError);
    });
});

if (internals.hasBigInt) {
    require('./extra/bigint').suite(lab);
}
else {
    describe('BigInt', () => {

        it('is ignored when parsing', () => {

            expect(Granola.parse(Helper.faker('n', '123'))).to.equal({ obj: undefined });
        });
    });
}

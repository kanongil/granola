'use strict';

const Granola = require('../..');


const internals = {};


internals.validate = function (expect, object, expected = object) {

    const json = Granola.stringify(object);
    expect(typeof json).to.equal('string');
    expect(() => JSON.parse(json)).to.not.throw();
    const output = Granola.parse(json);
    expect(output).to.equal(expected);
};


exports.createValidator = function (expect, { direct = false } = {}) {

    return (object, expected) => {

        if (!direct) {
            object = { obj: object };
            if (expected !== undefined) {
                expected = { obj: expected };
            }
        }
        return internals.validate(expect, object, expected);
    };
};


exports.faker = function (type, encoded) {

    return `{"$x":{"${type}":[["obj"]]},"obj":${encoded}}`;
};

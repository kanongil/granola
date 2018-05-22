'use strict';

const internals = {
    base64valid: /^(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}(==)?|[A-Za-z0-9+\/]{3}=?)?$/,
    /* $lab:coverage:off$ */
    BigInt: global.BigInt || (() => undefined)
    /* $lab:coverage:on$ */
};


exports.stringify = function (input) {

    const xtypes = [];
    let active;

    const replacer = function (key, jsonValue) {

        if (active && !active.parent && key === '$x') {
            throw new TypeError('stringify() input object cannot have a top-level "$x" property.');
        }

        while (active && ((active.key !== undefined && active.obj[active.key] !== this) ||
            (active.key === undefined && active.obj !== this))) {

            active = active.parent;
        }

        const type = typeof jsonValue;
        if (type === 'object' && jsonValue !== null) {
            active = { obj: this, key, parent: active };

            const value = this[key];
            if (jsonValue.type === 'Buffer' && Buffer.isBuffer(value)) {
                active.type = 'B';
                xtypes.push(active);
                return value.toString('base64');
            }

            if (value instanceof Set) {
                active.type = 'S';
                xtypes.push(active);
                active = { obj: [...value], parent: active };
                return active.obj;
            }

            if (value instanceof Map) {
                active.type = 'M';
                xtypes.push(active);
                active = { obj: [...value], parent: active };
                return active.obj;
            }
        }
        else if (type === 'string') {
            if (this[key] instanceof Date) {
                xtypes.push({ key, type: 'D', parent: active });
                return jsonValue;
            }
        }
        /* $lab:coverage:off$ */
        else if (type === 'bigint') {
            xtypes.push({ key, type: 'n', parent: active });
            if (jsonValue >= Number.MIN_SAFE_INTEGER && jsonValue <= Number.MAX_SAFE_INTEGER) {
                return Number(jsonValue);
            }
            return `${jsonValue}`;
        }
        /* $lab:coverage:on$ */

        return jsonValue;
    };

    const json = JSON.stringify(input, replacer);

    if (xtypes.length !== 0) {
        if (json[0] !== '{') {
            throw new TypeError('stringify() input must convert to an "object" when extended types are encoded.');
        }

        const $x = {};
        for (let entry of xtypes) {
            const type = entry.type;
            const segments = [];
            while (entry.parent) {
                if (entry.key !== undefined) {
                    segments.unshift(entry.key);
                }
                entry = entry.parent;
            }

            const arr = $x[type] || [];
            $x[type] = arr;
            arr.push(segments);
        }

        return `{"$x":${JSON.stringify($x)},${json.slice(1)}`;
    }

    return json;
};


internals.isExtended = function (parsed) {

    const { $x: types } = parsed;
    if (types === undefined) {
        return false;
    }

    // Only detect as extended if it is a plain object

    if (typeof types !== 'object' || types === null || Array.isArray(types)) {
        return false;
    }

    return true;
};


internals.parseOfType = function (obj, paths, create) {

    for (const path of paths) {
        let ref = obj;
        for (let i = 0; i < path.length - 1; ++i) {
            const key = path[i];
            ref = ref[key];
            if (typeof ref !== 'object' || ref === null) {
                ref = undefined;
                break;
            }
        }

        const entry = path[path.length - 1];
        if (ref && (entry in ref)) {
            ref[entry] = create(ref[entry], path.parser);
        }
    }
};


internals.parseBuffer = function (coded) {

    if (typeof coded === 'string') {
        if (!internals.base64valid.test(coded)) {
            throw SyntaxError('Invalid base64 buffer encoding');
        }
    }

    return Buffer.from(coded, 'base64');
};


internals.typeParsers = {
    B: internals.parseBuffer,
    D: (coded) => new Date(coded),
    S: (coded) => new Set(coded),
    M: (coded) => new Map(coded),
    n: (coded) => internals.BigInt(coded)
};


internals.containerParser = function (coded, parser) {

    return parser(coded);
};


exports.parse = function (str) {

    const parsed = JSON.parse(str);

    if (!parsed || !internals.isExtended(parsed)) {
        return parsed;
    }

    const { $x: types } = parsed;

    for (const type in types) {
        if (type === 'M' || type === 'S') {
            continue;
        }

        if (Array.isArray(types[type])) {
            const parser = internals.typeParsers[type] || (() => undefined);
            internals.parseOfType(parsed, types[type], parser);
        }

        delete types[type];
    }

    // Map and Set needs to be decoded last, longest path first

    const paths = [];
    for (const type in types) {
        if (Array.isArray(types[type])) {
            const parser = internals.typeParsers[type];
            paths.push(...types[type].map((path) => {

                path.parser = parser;
                return path;
            }));
        }
    }
    paths.sort((a, b) => b.length - a.length);

    internals.parseOfType(parsed, paths, internals.containerParser);

    delete parsed.$x;

    return parsed;
};

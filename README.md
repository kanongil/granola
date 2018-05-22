# granola

`JSON` compatible string serialization for sharing object state in node.js.

Lead Maintainer - [Gil Pedersen](https://github.com/kanongil)

**granola** provides a `JSON` compatible stringifier and parser with support for modern language and object primitives.

In addition to the standard `JSON` primitives, it can encode and decode:

* Valid `Date` objects.
* `Map` objects.
* `Set` objects.
* `Buffer` objects.
* `BigInt` numbers (requires native `BigInt` support).

Any other object or primitive are encoded using the standard `JSON` stringifier.

To support these extra types, a metadata object is added to the encoded `JSON` string, but only when they are used. Otherwise, the stringified output will be identical to `JSON.stringify()`. This also mean that the parser will correctly handle plain `JSON`.

The only requirement for the `input`, is that it stringifies as an `object` that does not have a top-level `$x` property. If the input is likely to contain this property, it should be renamed, or moved to a lower level.

Note: Unlike `JSON`, the encoded string is not designed to be used in human edited form, but for machine processing.

The implementation allows for new object types to be encoded in the scheme. If the implementation encounters an unknown type when parsing, the input data is ignored, and it is decoded as `undefined`.

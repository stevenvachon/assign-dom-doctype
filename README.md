# assign-dom-doctype [![NPM Version][npm-image]][npm-url] ![File Size][filesize-image] ![Build Status][ci-image] [![Coverage Status][coveralls-image]][coveralls-url]

> Insert, replace or remove a [`DocumentType` node](https://mdn.io/DocumentType) within a [`Document`](https://mdn.io/Document).


## Installation

[Node.js](http://nodejs.org) `>= 10` is required. To install, type this at the command line:
```shell
npm install assign-dom-doctype
```


## Importing

ES Module:
```js
import assignDoctype from 'assign-dom-doctype';
```

CommonJS Module:
```js
const assignDoctype = require('assign-dom-doctype');
```


## Usage
Insert or replace:
```js
const newDoctype = document.implementation.createDocumentType('qualifiedNameStr', 'publicId', 'systemId');

assignDoctype(newDoctype, document);
````

Remove:
```js
assignDoctype(null, document);
```

The `Document`'s previous [`doctype`](https://mdn.io/Document/doctype) value will be returned.


## Compatibility

Depending on your target browsers, you may need polyfills/shims for the following:

* [`Node::before`](https://mdn.io/Node/before)
* [`Node::remove`](https://mdn.io/Node/remove)
* [`Node::replaceWith`](https://mdn.io/Node/replaceWith)


[npm-image]: https://img.shields.io/npm/v/assign-dom-doctype.svg
[npm-url]: https://npmjs.com/package/assign-dom-doctype
[filesize-image]: https://img.shields.io/badge/size-540B%20gzipped-blue.svg
[ci-image]: https://github.com/stevenvachon/assign-dom-doctype/workflows/tests/badge.svg
[coveralls-image]: https://img.shields.io/coveralls/stevenvachon/assign-dom-doctype.svg
[coveralls-url]: https://coveralls.io/github/stevenvachon/assign-dom-doctype

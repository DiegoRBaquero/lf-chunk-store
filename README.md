# lf-chunk-store [![travis][travis-image]][travis-url] [![npm][npm-image]][npm-url] [![downloads][downloads-image]][downloads-url]
                 
[travis-image]: https://img.shields.io/travis/DiegoRBaquero/lf-chunk-store.svg?style=flat
[travis-url]: https://travis-ci.org/DiegoRBaquero/lf-chunk-store
[npm-image]: https://img.shields.io/npm/v/lf-chunk-store.svg?style=flat
[npm-url]: https://npmjs.org/package/lf-chunk-store
[downloads-image]: https://img.shields.io/npm/dm/lf-chunk-store.svg?style=flat
[downloads-url]: https://npmjs.org/package/lf-chunk-store

#### Browser localForage chunk store that is [abstract-chunk-store](https://github.com/mafintosh/abstract-chunk-store) compliant

## Install

```
npm install lf-chunk-store
```

## Usage

### Generate random prefix

``` js
var LFChunkStore = require('lf-chunk-store')

var chunks = new LFChunkStore(10)
```

### Use specified prefix

``` js
var LFChunkStore = require('lf-chunk-store')

var chunks = new LFChunkStore(10, {
  prefix: 'myFile.txt'
})
```

### put, get, close, destroy

```js
chunks.put(0, new Buffer('0123456789'), function (err) {
  if (err) throw err

  chunks.get(0, function (err, chunk) {
    if (err) throw err
    console.log(chunk) // '0123456789' as a buffer

    chunks.close(function (err) {
      if (err) throw err
      console.log('storage is closed')

      chunks.destroy(function (err) {
        if (err) throw err
        console.log('files is deleted')
      })
    })
  })
})
```

## License

MIT. Copyright (c) [Diego Rodríguez Baquero](http://diegorbaquero.com).
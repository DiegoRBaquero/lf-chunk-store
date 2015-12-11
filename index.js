module.exports = Storage

var localforage = require('localforage')

function Storage (chunkLength, opts) {
  if (!(this instanceof Storage)) return new Storage(chunkLength, opts)
  if (!opts) opts = {}

  this.chunkLength = Number(chunkLength)
  if (!this.chunkLength) throw new Error('First argument must be a chunk length')
  this.prefix = opts.prefix || opts.files ? opts.files[0].path : Math.random().toString(36)

  this.chunks = []
  this.closed = false
  this.length = Number(opts.length) || Infinity
  this.overlap = false

  if (this.length !== Infinity) {
    this.lastChunkLength = (this.length % this.chunkLength) || this.chunkLength
    this.lastChunkIndex = Math.ceil(this.length / this.chunkLength) - 1
  }

  this.localForage = localforage.createInstance({})
}

Storage.prototype.put = function (index, buf, cb) {
  console.info('put ' + index + ' from ' + arguments.callee.caller.toString())
  if (this.closed) return nextTick(cb, new Error('Storage is closed'))
  var isLastChunk = (index === this.lastChunkIndex)
  if (isLastChunk && buf.length !== this.lastChunkLength) {
    return nextTick(cb, new Error('Last chunk length must be ' + this.lastChunkLength))
  }
  if (!isLastChunk && buf.length !== this.chunkLength) {
    return nextTick(cb, new Error('Chunk length must be ' + this.chunkLength))
  }

  var toInsert = JSON.stringify(JSON.parse(JSON.stringify({object: buf, length: buf.length, time: Date.now()})))
  var succeed = false
  while (!succeed && !this.overlap) {
    try {
      this.localForage.setItem(this.prefix + '_' + index, toInsert)
      succeed = true
    } catch (e) {
      console.error(e)
      var clearedSpace = 0
      while (clearedSpace < buf.length) {
        var oldestKey = this.localForage.key(0)
        var oldestEntry = this.localForage.getItem(oldestKey)
        var oldestTime = JSON.parse(oldestEntry).time
        var oldestLength = oldestEntry.length
        for (var key in this.localForage) {
          if (key === 'debug') continue
          if (key.startsWith(this.prefix)) {
            continue
          }
          var tempEntry = this.localForage.getItem(key)
          if (tempEntry == null) continue
          var tempObject = JSON.parse(tempEntry)
          if (tempObject.time < oldestTime) {
            oldestKey = key
            oldestTime = tempObject.time
            oldestLength = tempEntry.length
          }
        }
        if (oldestKey.startsWith(this.prefix)) {
          this.overlap = true
          break
        }
        this.localForage.removeItem(oldestKey)
        clearedSpace += oldestLength
      }
    }
  }
  if (this.overlap) {
    console.info('storing in mem')
    this.chunks[index] = buf
  }

  nextTick(cb, null)
}

Storage.prototype.get = function (index, opts, cb) {
  console.info('get ' + index)
  if (typeof opts === 'function') return this.get(index, null, opts)
  if (this.closed) return nextTick(cb, new Error('Storage is closed'))
  var buf = this.chunks[index]
  if (!buf) {
    console.info('not in mem ' + index)
    this.localForage.getItem(this.prefix + '_' + index, function(err, lsItem) {
        if (err != null) {
          console.error(err)
          return nextTick(cb, new Error('Chunk not found'))
        }  
        if (lsItem != null) {
          console.info('creating buf ' + index)
          buf = new Buffer(JSON.parse(lsItem).object.data)
        }
        if (!buf) return nextTick(cb, new Error('Chunk not found'))
        if (!opts) return nextTick(cb, null, buf)
        var offset = opts.offset || 0
        var len = opts.length || (buf.length - offset)
        nextTick(cb, null, buf.slice(offset, len + offset))
    })
  } else {
    console.info('In memory ' + index)
    if (!opts) return nextTick(cb, null, buf)
    var offset = opts.offset || 0
    var len = opts.length || (buf.length - offset)
    nextTick(cb, null, buf.slice(offset, len + offset))
  }  
}

Storage.prototype.close = function (cb) {
  if (this.closed) return nextTick(cb, new Error('Storage is already closed'))
  this.closed = true
  nextTick(cb, null)
}

Storage.prototype.destroy = function (cb) {
  var self = this
  this.closed = true
  this.chunks = null
  this.localForage.keys(function (err, keys) {
    if (err != null) {
      console.error(err)
    }
    for (var key in keys) {
      key = keys[key]
      if (key.startsWith(self.prefix)) {
        self.localForage.removeItem(key)
      }
    }
    nextTick(cb, null)
  })
}

function nextTick (cb, err, val) {
  process.nextTick(function () {
    if (cb) cb(err, val)
  })
}

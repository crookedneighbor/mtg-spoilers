'use strict'

var SpoilerHandle = require('./lib/spoiler-handle')

module.exports = function pollForSpoilers (code, options) {
  if (!code) {
    throw new Error('Must supply set code parameter.')
  }
  if (!options || typeof options.onNewSpoilers !== 'function') {
    throw new Error('Must supply an onNewSpoilers function in options.')
  }

  var handle = new SpoilerHandle(options)

  return handle.initialize(code)
}

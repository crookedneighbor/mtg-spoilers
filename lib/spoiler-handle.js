'use strict'

var ScryfallClient = require('scryfall-client')

var FIFTEEN_MINUTES = 900000
var TWENTY_FOUR_HOURS = 86400000

var DEFAULT_ITERATION = FIFTEEN_MINUTES
var DEFAULT_TIMEOUT = TWENTY_FOUR_HOURS

function SpoilerHandle (options) {
  var self = this
  var client = new ScryfallClient(options.scryfallClientOptions)

  var iteration = options.iteration || DEFAULT_ITERATION
  var timeout = options.timeout || DEFAULT_TIMEOUT
  var onNewSpoilers = options.onNewSpoilers

  var intervalReference, timeoutReference

  var lookupSpoilers = function (code) {
    return client.get('/cards/search', {
      q: 'set:' + code,
      order: 'spoiled',
      dir: 'desc'
    })
  }

  var setLatestSpoiler = function (spoilers) {
    self.latestSpoiler = spoilers[0]
  }

  var clearTimeoutReference = function () {
    if (timeoutReference) {
      clearTimeout(timeoutReference)
      timeoutReference = null
    }
  }
  var setupTimeout = function () {
    clearTimeoutReference()

    if (timeout !== Infinity) {
      timeoutReference = setTimeout(function () {
        self.cancel()
      }, timeout)
    }
  }

  var fetchSpoilers = function () {
    lookupSpoilers(self.set.code).then(function (spoilers) {
      if (spoilers.length === 0) {
        return
      }

      if (spoilers[0].id === self.latestSpoiler.id) {
        return
      }
      var oldSpoilerIndex = spoilers.findIndex(function (card) {
        return card.id === self.latestSpoiler.id
      })

      setLatestSpoiler(spoilers)
      setupTimeout()

      if (oldSpoilerIndex > -1) {
        onNewSpoilers(spoilers.slice(0, oldSpoilerIndex))
      } else {
        onNewSpoilers(spoilers)
      }
    })
  }

  this.initialize = function (code) {
    return client.get('/sets/' + code).then(function (set) {
      self.set = set
      return lookupSpoilers(set.code)
    }).then(function (spoilers) {
      setLatestSpoiler(spoilers)

      setupTimeout()

      intervalReference = setInterval(function () {
        fetchSpoilers()
      }, iteration)

      return self
    })
  }

  this.cancel = function () {
    if (intervalReference) {
      clearInterval(intervalReference)
      intervalReference = null
    }
    clearTimeoutReference()
  }
}

module.exports = SpoilerHandle

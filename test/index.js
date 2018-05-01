'use strict'

const pollForSpoilers = require('../')
const SpoilerHandle = require('../lib/spoiler-handle')

describe('mtg-spoilers', function () {
  it('throws an error if no code is passed in', function () {
    expect(() => {
      pollForSpoilers()
    }).to.throw('Must supply set code parameter.')
  })

  it('throws an error if no options are passed in', function () {
    expect(() => {
      pollForSpoilers('dom')
    }).to.throw('Must supply an onNewSpoilers function in options.')
  })

  it('throws an error if no onNewSpoilers option is passed in', function () {
    expect(() => {
      pollForSpoilers('dom', {})
    }).to.throw('Must supply an onNewSpoilers function in options.')
  })

  it('throws an error if onNewSpoilers option is not a function', function () {
    expect(() => {
      pollForSpoilers('dom', {onNewSpoilers: {}})
    }).to.throw('Must supply an onNewSpoilers function in options.')
  })

  it('resolves with a SpoilerHandle', function () {
    this.timeout(10000)

    return pollForSpoilers('dom', {onNewSpoilers: this.sandbox.stub}).then((handle) => {
      expect(handle).to.be.an.instanceof(SpoilerHandle)

      handle.cancel()
    })
  })

  it('can pass scryfall client options', function () {
    this.timeout(10000)

    return pollForSpoilers('dom', {
      onNewSpoilers: this.sandbox.stub,
      scryfallClientOptions: {
        convertSymbolsToSlackEmoji: true
      }
    }).then((handle) => {
      expect(handle.latestSpoiler.mana_cost).to.equal(':mana-1::mana-G:')
      handle.cancel()
    })
  })
})

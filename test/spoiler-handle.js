'use strict'

const ScryfallClient = require('scryfall-client')
const SpoilerHandle = require('../lib/spoiler-handle')

describe('SpoilerHandle', function () {
  beforeEach(function () {
    this.fakeSetObject = {
      code: 'dom',
      name: 'Dominaria'
    }
    this.fakeCardsList = [{
      id: 'id-1',
      name: 'Card Name'
    }]
    this.request = this.sandbox.stub(ScryfallClient.prototype, 'get')
    this.request.withArgs('/sets/dom').resolves(this.fakeSetObject)
    this.request.withArgs('/cards/search').resolves(this.fakeCardsList)
    this.clock = this.sandbox.useFakeTimers()
    this.handle = new SpoilerHandle({
      onNewSpoilers: this.sandbox.stub()
    })
  })

  it('looks up set for specified code', function () {
    return this.handle.initialize('dom').then(() => {
      expect(this.request).to.be.calledWith('/sets/dom')

      this.handle.cancel()
    })
  })

  it('requests the most recent spoiler card right away', function () {
    return this.handle.initialize('dom').then(() => {
      expect(this.request).to.be.calledWith('/cards/search', {
        q: 'set:dom',
        order: 'spoiled',
        dir: 'desc'
      })

      this.handle.cancel()
    })
  })

  it('resolves with a handler object', function () {
    return this.handle.initialize('dom').then(() => {
      expect(this.handle.latestSpoiler).to.equal(this.fakeCardsList[0])
      expect(this.handle.set).to.equal(this.fakeSetObject)
      expect(this.handle.cancel).to.be.a('function')

      this.handle.cancel()
    })
  })

  it('looks up spoilers every 15 minutes', function () {
    return this.handle.initialize('dom').then(() => {
      this.request.resetHistory()
      this.clock.tick(100)

      expect(this.request.callCount).to.equal(0)

      this.clock.tick(900000)

      expect(this.request.callCount).to.equal(1)

      this.clock.tick(900000)

      expect(this.request.callCount).to.equal(2)

      this.handle.cancel()
    })
  })

  it('can specify iteration for spoiler polling', function () {
    const handle = new SpoilerHandle({
      iteration: 500,
      onNewSpoilers: this.sandbox.stub()
    })
    return handle.initialize('dom').then(() => {
      this.request.resetHistory()
      this.clock.tick(100)

      expect(this.request.callCount).to.equal(0)

      this.clock.tick(500)

      expect(this.request.callCount).to.equal(1)

      this.clock.tick(500)

      expect(this.request.callCount).to.equal(2)

      handle.cancel()
    })
  })

  it('times out looking up spoilers after twenty four hours', function () {
    return this.handle.initialize('dom').then(() => {
      this.request.resetHistory()
      this.clock.tick(86400000)

      const savedCallCount = this.request.callCount
      expect(savedCallCount).to.be.greaterThan(20)

      this.clock.tick(86400000)

      expect(this.request.callCount).to.equal(savedCallCount)

      this.handle.cancel()
    })
  })

  it('resets timeout when a new spoiler is found', function () {
    return this.handle.initialize('dom').then(() => {
      this.request.resetHistory()
      this.clock.tick(80400000)

      let savedCallCount = this.request.callCount
      expect(savedCallCount).to.be.greaterThan(20)

      this.fakeCardsList.unshift({
        id: 'id-2',
        name: 'Card 2'
      })

      this.clock.tick(1000000)

      expect(this.request.callCount).to.be.greaterThan(savedCallCount)
      savedCallCount = this.request.callCount

      this.fakeCardsList.unshift({
        id: 'id-3',
        name: 'Card 3'
      })

      this.clock.tick(4000500)

      this.fakeCardsList.unshift({
        id: 'id-4',
        name: 'Card 4'
      })

      this.clock.tick(86400000)

      expect(this.request.callCount).to.be.greaterThan(savedCallCount)
      savedCallCount = this.request.callCount

      this.clock.tick(86400000)

      expect(this.request.callCount).to.equal(savedCallCount)

      this.handle.cancel()
    })
  })

  it('can specify custom timeout', function () {
    const handle = new SpoilerHandle({
      timeout: 500,
      onNewSpoilers: this.sandbox.stub()
    })
    return handle.initialize('dom').then(() => {
      this.request.resetHistory()
      this.clock.tick(510)

      const savedCallCount = this.request.callCount

      this.clock.tick(86400000)

      expect(this.request.callCount).to.equal(savedCallCount)

      this.handle.cancel()
    })
  })

  it('can specify a function to call when timeout occurs', function () {
    const onTimeout = this.sandbox.stub()
    const handle = new SpoilerHandle({
      onTimeout,
      onNewSpoilers: this.sandbox.stub()
    })
    return handle.initialize('dom').then(() => {
      this.request.resetHistory()
      this.clock.tick(510)

      expect(onTimeout.callCount).to.equal(0)

      this.clock.tick(86400000)

      expect(onTimeout.callCount).to.equal(1)
    })
  })

  it('does not call onTimeout when cancel is called', function () {
    const onTimeout = this.sandbox.stub()
    const handle = new SpoilerHandle({
      onTimeout,
      onNewSpoilers: this.sandbox.stub()
    })
    return handle.initialize('dom').then(() => {
      this.request.resetHistory()
      this.clock.tick(510)

      expect(onTimeout.callCount).to.equal(0)
      handle.cancel()

      this.clock.tick(1000)

      expect(onTimeout.callCount).to.equal(0)
    })
  })

  it('can specify Inifity for timeout', function () {
    const handle = new SpoilerHandle({
      timeout: Infinity,
      onNewSpoilers: this.sandbox.stub()
    })
    return handle.initialize('dom').then(() => {
      this.request.resetHistory()

      for (let i = 0; i < 5; i++) {
        const savedCallCount = this.request.callCount
        this.clock.tick(86400000)
        expect(this.request.callCount).to.be.greaterThan(savedCallCount)
      }

      this.handle.cancel()
    })
  })

  it('can cancel polling with handler', function () {
    return this.handle.initialize('dom').then(() => {
      this.request.resetHistory()
      this.clock.tick(100)

      expect(this.request.callCount).to.equal(0)

      this.clock.tick(900000)

      expect(this.request.callCount).to.equal(1)
      this.handle.cancel()

      this.clock.tick(900000000)

      expect(this.request.callCount).to.equal(1)
    })
  })

  it('calls onNewSpoilers with array of new cards when a new card is found', function (done) {
    const onNewSpoilers = (spoilers) => {
      expect(spoilers[0].id).to.equal('id-4')
      expect(spoilers[1].id).to.equal('id-3')
      expect(spoilers[2].id).to.equal('id-2')
      expect(spoilers[3]).to.equal(undefined)
      this.handle.cancel()
      done()
    }
    const handler = new SpoilerHandle({
      onNewSpoilers
    })

    handler.initialize('dom').then(() => {
      this.clock.tick(800000)
      this.fakeCardsList.unshift({
        id: 'id-2',
        name: 'Card 2'
      })
      this.fakeCardsList.unshift({
        id: 'id-3',
        name: 'Card 3'
      })
      this.fakeCardsList.unshift({
        id: 'id-4',
        name: 'Card 4'
      })
      this.clock.tick(100000)
    }).catch(done)
  })

  it('calls onNewSpoilers with array of new cards when a new card is found and old spoiler id no longer exists', function (done) {
    const onNewSpoilers = (spoilers) => {
      expect(spoilers[0].id).to.equal('id-4')
      expect(spoilers[1].id).to.equal('id-3')
      expect(spoilers[2].id).to.equal('id-2')
      expect(spoilers[3]).to.equal(undefined)
      this.handle.cancel()
      done()
    }
    const handler = new SpoilerHandle({
      onNewSpoilers
    })

    handler.initialize('dom').then(() => {
      this.clock.tick(800000)
      this.fakeCardsList.pop()
      this.fakeCardsList.unshift({
        id: 'id-2',
        name: 'Card 2'
      })
      this.fakeCardsList.unshift({
        id: 'id-3',
        name: 'Card 3'
      })
      this.fakeCardsList.unshift({
        id: 'id-4',
        name: 'Card 4'
      })
      this.clock.tick(100000)
    }).catch(done)
  })

  it('updates latest spoiler when a new latest spoiler is found', function (done) {
    const onNewSpoilers = (spoilers) => {
      expect(handler.latestSpoiler).to.equal(spoilers[0])
      this.handle.cancel()
      done()
    }
    const handler = new SpoilerHandle({
      onNewSpoilers
    })

    handler.initialize('dom').then(() => {
      this.clock.tick(800000)

      this.fakeCardsList.pop()
      this.fakeCardsList.unshift({
        id: 'id-2',
        name: 'Card 2'
      })
      this.fakeCardsList.unshift({
        id: 'id-3',
        name: 'Card 3'
      })
      this.fakeCardsList.unshift({
        id: 'id-4',
        name: 'Card 4'
      })

      this.clock.tick(100000)
    }).catch(done)
  })
})

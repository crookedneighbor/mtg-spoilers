MTG Spoilers
============

A module for getting the latest Magic the Gathering spoilers as they become available.


## Installation

```
npm install mtg-spoilers --save
```

## Usage

The first argument is the set code, and the second argument is an options object with one required property, `onNewSpoilers`, a function to be called with an array of new cards when they become available. The card objects are [`scryfall-client` Card objects](https://github.com/crookedneighbor/scryfall-client#card).

```js
var pollForSpoilers = require('mtg-spoilers')

pollForSpoilers('dom', { // set code for Dominaria
  onNewSpoilers: (spoilers) => {
    let cardImages = spoilers.map(card => card.getImage())

    // display the cards
  }
}).then((handler) => {
  handler.latestSpoiler // whatever the latest spoiler is
  handler.cancel() // call this method to manually stop the polling
})
```

### options.iteration

By default, it will check for new cards every fifteen minutes. You can override this behavior by passing a number in milliseconds to `iteration` in the options object.

```js
pollForSpoilers('dom', {
  iteration: 300000, // 5 minutes
  onNewSpoilers: (spoilers) => { /* your function here */ }
}).then((handler) => {
  /* save handler */
})
```
### options.timeout

By default, it will automatically stop checking for new cards after 24 hours of no new spoilers. You can override this behavior by passing a number in milliseconds to `timeout` in the options object.

```js
pollForSpoilers('dom', {
  timeout: 86400000, // 24 hours
  onNewSpoilers: (spoilers) => { /* your function here */ }
}).then((handler) => {
  /* save handler */
})
```

If you only want the polling to stop by manually calling `cancel` on the handler, pass `Inifinity` for the value of `timeout`.

### options.onTimeout

An optional function that will be called when the polling times out. Will not fire when calling `cancel` on the handler.

```js
pollForSpoilers('dom', {
  onTimeout: function () {
    // alert user that polling has stopped
  },
  onNewSpoilers: (spoilers) => { /* your function here */ }
}).then((handler) => {
  /* save handler */
})
```

### options.scryfallClientOptions

Under the hood, `mtg-spoilers` uses [`scryfall-client`](https://www.npmjs.com/package/scryfall-client) to make requests to the Scryfall API. [Configuration](https://github.com/crookedneighbor/scryfall-client#additional-options) for the client can be passed as `options.scryfallClientOptions`.


```js
pollForSpoilers('dom', {
  scryfallClientOptions: {
    convertSymbolsToSlackEmoji: true // converts mana symbols to slack emoji format
  },
  onNewSpoilers: (spoilers) => { /* your function here */ }
}).then((handler) => {
  /* save handler */
})
```

## Testing

```
npm test
```

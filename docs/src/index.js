'use strict'

var ScryfallClient = require('scryfall-client')
var scryfall = new ScryfallClient()
var pollForSpoilers = require('../../')

var handler
var setsSelect = document.querySelector('#sets')
var cardWrapper = document.querySelector('#cards-wrapper')
var growl = document.querySelector('#growl-notification')

function showGrowl (message) {
  growl.querySelector('#growl-body').innerText = message
  growl.classList.add('show')
  setTimeout(function () {
    hideGrowl()
  }, 3000)
}

function hideGrowl () {
  var endTransition = function () {
    growl.querySelector('#growl-body').innerText = ''
    growl.removeEventListener('transionend', endTransition)
  }
  growl.addEventListener('transitionend', endTransition)
  growl.classList.remove('show')
}

function addCard (card) {
  var cardNode = document.createElement('img')

  card.getImage().then(function (img) {
    cardNode.src = img

    if (cardWrapper.firstChild) {
      cardWrapper.insertBefore(cardNode, cardWrapper.firstChild)
    } else {
      cardWrapper.appendChild(cardNode)
    }
  })
}

growl.querySelector('.delete').addEventListener('click', hideGrowl)

scryfall.get('/sets').then(function (sets) {
  sets.forEach(function (set) {
    var option = document.createElement('option')

    option.value = set.code
    option.innerText = set.name

    setsSelect.appendChild(option)
  })
})

setsSelect.addEventListener('change', function (e) {
  var selection = setsSelect.value
  var name = document.querySelector('option[value=' + selection + ']').innerText

  if (handler) {
    handler.cancel()
    handler = null
  }

  showGrowl('Looking for spoilers for ' + name + '.')

  pollForSpoilers(selection, {
    onNewSpoilers: function (spoilers) {
      spoilers.forEach(addCard)
    }
  }).then(function (_handler) {
    handler = _handler

    addCard(handler.latestSpoiler)
  })
})

'use strict'

const sinon = require('sinon')
const chai = require('chai')

chai.use(require('sinon-chai'))

global.expect = chai.expect

beforeEach(function () {
  this.sandbox = sinon.sandbox.create()
})

afterEach(function () {
  this.sandbox.restore()
})

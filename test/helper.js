'use strict'

const sinon = require('sinon')
const chai = require('chai')

chai.use(require('sinon-chai'))

global.expect = chai.expect

beforeEach(function () {
  this.sandbox = sinon.createSandbox()
})

afterEach(function () {
  this.sandbox.restore()
})

'use strict'

const test = require('ava')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const agentFixture = require('./fixtures/agent')
const agentFixture = require('./fixtures/metric')

let sandbox = null
let MetricStub = null

let newMetric = {
  id: 1,
  agentId: 1,
  type: 'memory',
  value: '25%',
  createdAt: new Date(),
  updateAt: new Date(),
  agent: agentFixtures.byId(1)
}

let uuid = 'yyy-yyy-yyy'
let uuidArgs = {
  where: {
    uuid
  }
}

test.beforeEach(async () => {
  sandbox = sandbox.create()
  MetricStub = {
    hasMany: sandbox.spy()
  }

  // Model create stub
  MetricStub.create = sandbox.stub()
  MetricStub.create.withArgs(newMetric).returns(Promise.resolve({
    toJSON() { return newMetric }
  }))

  // Model findAll stub
  MetricStub.findAll = sandbox.stub()
  MetricStub.findAll.withArgs().returns(Promise.resolve(metricFixture.all))  
})


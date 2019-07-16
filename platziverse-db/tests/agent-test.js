'use strict'

const test = require('ava')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const agentFixture = require('./fixtures/agent')

let config = {
  logging: function () {}
}

let MetricStub = {
  belongsTo: sinon.spy()
}

let single = Object.assign({}, agentFixture.single)
let id = 1
let uuid = 'yyy-yyy-yyy'
let AgentStub = null
let db = null
let sandbox = null

let uuidArgs = {
  where: { uuid }
}

let connectedArgs = {
  where: { connected: true }
}

let usernameArgs = {
  where: { username: 'platzi', connected: true }
}

let newAgent = {
  uuid: '123-123-123',
  name: 'test',
  username: 'test',
  hostname: 'test',
  pid: 0,
  connected: false
}

test.beforeEach(async () => {
  // Un sandbox es un ambiente especifico de sinon que se puede resetear
  // sino puede quedar con valores de pruebas anteriores.
  sandbox = sinon.createSandbox()
  AgentStub = {
    hasMany: sandbox.spy()
  }

  // Model create stub
  AgentStub.create = sandbox.stub()
  AgentStub.create.withArgs(newAgent).returns(Promise.resolve({
    toJSON () { return newAgent }
  }))

  // Model findOne stub
  AgentStub.findOne = sandbox.stub()
  AgentStub.findOne.withArgs(uuidArgs).returns(Promise.resolve(agentFixture.byUuid(uuid)))

  // Model update stub
  AgentStub.update = sandbox.stub()
  AgentStub.update.withArgs(single, uuidArgs).returns(Promise.resolve(single))

  // Model findById stub
  AgentStub.findById = sandbox.stub()
  AgentStub.findById.withArgs(id).returns(Promise.resolve(agentFixture.byId(id)))

  // MOdel findAll stub
  AgentStub.findAll = sandbox.stub()
  AgentStub.findAll.withArgs().returns(Promise.resolve(agentFixture.all))
  AgentStub.findAll.withArgs(connectedArgs).returns(Promise.resolve(agentFixture.connected))
  AgentStub.findAll.withArgs(usernameArgs).returns(Promise.resolve(agentFixture.platzi))

  // Cuando se este usando la libreria de la dirección se sobreescribe lo que este en {}
  const setupDatabase = proxyquire('../', {
    './models/agent': () => AgentStub,
    './models/metric': () => MetricStub
  })
  // const setupDatabase = require('../') // importación normal
  db = await setupDatabase(config)
})

test.afterEach(() => {
  sandbox && sinon.restore()
})

test.serial('make it pass', t => {
  console.log('Metric: ' + MetricStub.belongsTo.callCount)
  console.log('Agent: ' + AgentStub.hasMany.callCount)
  t.truthy(db.Agent, 'servicio de agente deberia de existir') // que sea una expresion verdadera (no necesariamente true)
})

// AVA por defecto es paralela, con .serial se hace para que un test no afecte otro
// por ejemplo el entorno de SINON
test.serial('setup', t => {
  console.log('Metric: ' + MetricStub.belongsTo.callCount)
  console.log('Agent: ' + AgentStub.hasMany.callCount)
  t.true(AgentStub.hasMany.called, 'Agent.Model.hasMany fue ejecutada')
  t.true(AgentStub.hasMany.calledWith(MetricStub), 'El argumento deberia ser el MetricModel')
  t.true(MetricStub.belongsTo.called, 'MetricModel.belongsTo fue ejecutada')
  t.true(MetricStub.belongsTo.calledWith(AgentStub), 'El argumento deberia ser el AgentModelo')
})

test.serial('Agent#findById', async t => {
  let agent = await db.Agent.findById(id)

  t.true(AgentStub.findById.called, 'findById debe ser llamado en model')
  t.true(AgentStub.findById.calledOnce, 'findById debe ser llamado una vez')
  t.true(AgentStub.findById.calledWith(id), 'findById debe ser llamado con el id especificado')

  t.deepEqual(agent, agentFixture.byId(id), 'deberian ser iguales')
})

test.serial('Agent#createOrUpdate - exists', async t => {
  let agent = await db.Agent.createOrUpdate(single)

  t.true(AgentStub.findOne.called, 'findOne deberia ser llamado en model')
  t.true(AgentStub.findOne.calledTwice, 'findOne debería ser llamada 2 veces')
  t.true(AgentStub.update.calledOnce, 'update deberia ser llamado una vez')

  t.deepEqual(agent, single, 'Agent debería ser iguales')
})

test.serial('Agent#createOrupdate - new', async t => {
  let agent = await db.Agent.createOrUpdate(newAgent)

  t.true(AgentStub.findOne.called, 'findOne deberia ser llamado en model')
  t.true(AgentStub.findOne.calledOnce, 'findOne deberia ser llamado una vez')
  t.true(AgentStub.findOne.calledWith({
    where: { uuid: newAgent.uuid }
  }), 'findOne deberia ser llamado con los argumentos de uuid')
  t.true(AgentStub.create.called, 'create deberia ser llamado en model')
  t.true(AgentStub.create.calledOnce, 'create deberia ser llamado una vez')
  t.true(AgentStub.create.calledWith(newAgent), 'create deberia ser llamado con los argumentos de nuevo agente')

  t.deepEqual(agent, newAgent, 'agent deberia ser igual')
})

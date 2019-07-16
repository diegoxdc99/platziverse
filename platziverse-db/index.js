'use strict'

const setupDatabase = require('./lib/db')
const setupAgentModel = require('./models/agent')
const setupMetricModel = require('./models/metric')
const setupAgent = require('./lib/agent')
const setupMetric = require('./lib/metric')
const defaults = require('defaults')

module.exports = async function (config) {
  config = defaults(config, {
    dialect: 'sqlite',
    pool: {
      max: 10,
      min: 0,
      idle: 10000 // si esta inactiva por 10 segundos se quita
    },
    query: {
      raw: true // entregue json con datos basicos
    }
  })

  const sequelize = setupDatabase(config)
  const AgentModel = setupAgentModel(config)
  const MetricModel = setupMetricModel(config)

  AgentModel.hasMany(MetricModel) // un agente tiene muchas metricas
  MetricModel.belongsTo(AgentModel) // una metrica pertenece a un agente

  await sequelize.authenticate() // Se conecta a la BD y valida si hay coneccion
  // cuando son promesas se puede usar await y pausa hasta que sea resuelta

  if (config.setup) {
    await sequelize.sync({ force: true }) // Toda la definición de los modelos que se crearon si no existen en la bd las crea
    // foce: true => si la BD existe borre y vuelva a crear
  }

  const Agent = setupAgent(AgentModel)
  const Metric = setupMetric(MetricModel, AgentModel)

  return {
    Agent,
    Metric
  }
}

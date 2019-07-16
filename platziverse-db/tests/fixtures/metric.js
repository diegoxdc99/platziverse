'use strict'

const agentFixtures = require('./agent')

const metric = {
  id: 1,
  agentId: 1,
  type: 'memory',
  value: '25%',
  createdAt: new Date(),
  updateAt: new Date(),
  agent: agentFixtures.byId(1)
}

const metrics = [
  metric,
  extend(metric, { id: 2, type: 'temperature', value: '45C' }),
  extend(metric, { id: 3, type: 'humidity', value: '40%' }),
  extend(metric, { id: 4, type: 'distance', value: '43m' })
]

function extend(obj, values) {
  const clone = Object.assign({}, obj)
  return Object.assign(clone, values)
}

module.exports = {
  single: metric,
  all: metrics,
  byAgentUuid: uuid => metrics.filter(metric => metric.agent.uuid === uuid)
    .map(metric => metric.type)
    .filter((metric, index, array) => array.indexOf(metric) === index),
    byTypeAgentUuid: (type, uuid) => metrics.filter(metric => metric.type === type && metric.agent.uuid === uuid)
    .map(metric => {
      const newMetric = {
        id: metric.id,
        type: metric.type,
        value: metric.value,
        createdAt: metric.createdAt
      }
      return newMetric
    })
    .sort((a, b) => {
      return new Date(b.date) - new Date(a.date)
    })
}
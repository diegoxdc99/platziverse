'use strict'

module.exports = function setupMetric (MetricModel, AgentModel) {
  async function findByAgentUuid (uuid) {
    return MetricModel.findAll({
      attributes: ['type'], // para seleccionar los campos que se desean en la consulta
      group: ['type'], // agrupar por tipo
      include: [{ // para hacewr un JOIN
        attributes: [], // que columnas de la tabla necesita
        model: AgentModel, // con que tabla se quiere hacer el JOIN
        where: {
          uuid
        }
      }],
      raw: true // retornar solo el JSON, no acepta la propiedad global si es con JOIN
    })
  }

  async function findByTypeAgentUuid (type, uuid) {
    return MetricModel.findAll({
      attributes: [ 'id', 'type', 'value', 'createdAt' ],
      where: {
        type
      },
      limit: 20, // limita los registros que retorne
      order: [[ 'createdAt', 'DESC' ]],
      include: [{
        attibutes: [],
        model: AgentModel,
        where: {
          uuid
        }
      }],
      raw: true
    })
  }

  async function create (uuid, metric) {
    const agent = await AgentModel.findOne({
      where: { uuid }
    })

    if (agent) {
      Object.assign(metric, { agentId: agent.id }) // metric.agentId = agent.id
      const result = await MetricModel.create(metric)
      return result.toJSON()
    }
  }

  return {
    create,
    findByAgentUuid,
    findByTypeAgentUuid
  }
}

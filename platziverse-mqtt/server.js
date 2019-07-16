'use strict'

const debug = require('debug')('platziverse:mqtt')
const mosca = require('mosca')
const redis = require('redis')
const chalk = require('chalk')
const db = require('platziverse-db')

const { parsePayLoad } = require('./utils')

const backend = {
  type: 'redis',
  redis,
  return_buffers: true // información binaria para rendimiento
}

const settings = {
  port: 1883,
  backend
}

const config = require('../platziverse-db/config-db')()

const server = new mosca.Server(settings)
const clients = new Map()

let Agent, Metric

// evento cuando un cliente se conecta al servidor
server.on('clientConnected', client => {
  debug(`Cliente conectado: ${client.id} :o`)
  clients.set(client.id, null)
})

server.on('clientDisconnected', async (client) => {
  debug(`Cliente desconectado: ${client.id} :(`)
  const agent = clients.get(client.id)

  if (agent) {
    // Marcar agente como desconectado
    agent.connected = false

    try {
      await Agent.createOrUpdate(agent)
    } catch (e) {
      return handleError
    }

    // borrar agente de la lista de clientes
    clients.delete(client.id)

    server.publish({
      topic: 'agent/disconnected',
      payload: JSON.stringify({
        agent: {
          uuid: agent.uuid
        }
      })
    })

    debug(`Cliente (${client.id}) asociado al agente con (${agent.uuid}) fue marcado como desconectado`)
  }
})

server.on('published', async (packet, client) => {
  debug(`Recibido: ${packet.topic}`) // tipo de evento personalizado (agentconnected)

  switch (packet.topic) {
    case 'agent/connected':
    case 'agent/disconnected':
      debug(`Carga: ${packet.payload}`) // contiene la informacion enviada
      break
    case 'agent/message':
      debug(`Carga: ${packet.payload}`)

      const payload = parsePayLoad(packet.payload)

      if (payload) {
        payload.agent.connected = true

        let agent
        try {
          agent = await Agent.createOrUpdate(payload.agent)
        } catch (e) {
          return handleError(e)
        }
        debug(`Agent ${agent.uuid} guardado`)

        // notificar que el agente fue conectado
        if (!clients.get(client.id)) {
          clients.set(client.id, agent)
          server.publish({
            topic: 'agent/connected',
            payload: JSON.stringify({
              agent: {
                uuid: agent.uuid,
                name: agent.name,
                hostname: agent.hostname,
                pid: agent.pid,
                connected: agent.connected
              }
            })
          })
        }

        // Guardar metricas
        for (let metric of payload.metrics) {
          let m

          try {
            m = await Metric.create(agent.uuid, metric)
          } catch (e) {
            return handleError(e)
          }

          debug(`Metrica ${m.id} fue guardada en el agente ${agent.uuid}`)
        }
      }
      break
  }
})

// evento de servidor corriendo
server.on('ready', async () => {
  const services = await db(config).catch(handleFatalError)

  Agent = services.Agent
  Metric = services.Metric

  console.log(`${chalk.green('[platziverse-mqtt]')} Servidor está corriendo :)`)
})

server.on('error', handleFatalError) // el servidor por algo mande un error
server.on('uncaughtException', handleFatalError) // excepcion que no fue manejada a nivel del proceso
server.on('unhandledRejection', handleFatalError) // cuando no se maneja una promesa rechazada

function handleFatalError (err) {
  console.log(`${chalk.red('[fatal error]')} ${err.message}`)
  console.error(err.stack)
  process.exit(1)
}

function handleError (err) {
  console.log(`${chalk.red('[fatal error]')} ${err.message}`)
  console.error(err.stack)
}

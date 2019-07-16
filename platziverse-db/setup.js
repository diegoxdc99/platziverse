'use strict'

const debug = require('debug')('platziverse:db:setup') // permite mensajes de logs si se tiene una variable de entorno configurada
const inquirer = require('inquirer') // para hacer preguntas por la consola
const chalk = require('chalk') // para popner colores por la consola
const db = require('./')

const prompt = inquirer.createPromptModule() // permite hacer preguntas y son promesas
const argv = require('yargs').argv

async function setup () {  
  if (!(argv.y || argv.yes)){
    const answer = await prompt({
      type: 'confirm',
      name: 'setup', // nombre de la variable
      message: 'Esto va a destruir la base de datos ¿está seguro?'
    })
  
    if (!answer.setup) {
      return console.log('No pasa nada, la buena :)')
    }
  }  

  const config = require('./config-db')(true)

  await db(config).catch(handleFatalError)

  console.log('Success!')
  process.exit(0)
}

function handleFatalError (err) {
  console.error(`${chalk.red('[Error fatal]')} ${err.message}`)
  console.error(err.stack)
  process.exit(1) // matar el proceso
}

setup()

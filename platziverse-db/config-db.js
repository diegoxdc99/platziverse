'use strict'

const debug = require('debug')('platziverse:db:setup')

module.exports = function (init = false) {
  return {
    database: process.env.DB_NAME || 'platziverse',
    username: process.env.DB_USER || 'platzi',
    password: process.env.DB_PASS || 'platzi',
    hots: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: s => debug(s), // para ver que mensajes esta devolviendo la base de datos
    setup: init
  }
}
'use strict'
const { Client } = require('pg')
const fs = require('fs')
const { default: axios } = require('axios')

const config = {
  connectionString:
    'postgres://candidate:62I8anq3cFq5GYh2u4Lh@rc1b-r21uoagjy1t7k77h.mdb.yandexcloud.net:6432/db1',
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync('root.crt').toString(),
  },
}

const client = new Client(config)

async function getDataAndInsert() {
  try {
    await client.connect()
    console.log('Connected to db open')

    await client.query('DROP TABLE IF EXISTS test_table')
    console.log('Table was deleted')

    await client.query(`
            CREATE TABLE test_table (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            data JSONB NOT NULL
        )`)
    console.log('Table was created')
    console.log('Writing data in db...')
    let url = 'https://rickandmortyapi.com/api/character'
    while (url) {
      try {
        const response = await axios.get(url)
        if (!response.data || !response.data.results) {
          throw new Error('Data not found')
        }
        const data = response.data.results
        const insertQuery = 'INSERT INTO test_table (name, data) VALUES($1, $2)'
        for (const item of data) {
          const name = item.name
          await client.query(insertQuery, [name, item])
        }

        url = response.data.info.next
      } catch (error) {
        console.error(error)
        break
      }
    }
  } catch (err) {
    console.error(err)
  } finally {
    await client.end()
    console.log('Connected to db closed')
  }
}

getDataAndInsert()

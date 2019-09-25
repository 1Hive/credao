const { Client } = require('pg')
const client = new Client(process.env.DATABASE_URL)
const { readFile, mkdirp } = require('fs-extra')
const base64url = require("base64url")
const { promisify } = require('util')
const exec = promisify(require('child_process').exec)

module.exports = {
  start
}

async function start(){

  await client.connect()
  await client.query('LISTEN new_target')

  client.on('error', err => {
    console.error('something bad has happened!', err.stack)
  })

  client.on('notification', function({channel, payload}) {
    switch(channel){
      case 'new_target':
        collectCred(payload)
    }
  })

}

async function collectCred(target){
  const dir = `${process.env.SOURCECRED_OUTPUT}`
  await mkdirp(dir)

  // TODO - using githubToken from user here gives error "GitHub Apps are not allowed access to search"
  // temporarily using personal GITHUB_TOKEN env variable
  let cmd = `
export SOURCECRED_DIRECTORY=${dir} &&
export SOURCECRED_GITHUB_TOKEN=${process.env.GITHUB_TOKEN} &&
node ${process.env.SOURCECRED_BIN} load ${target}`

  console.log(cmd)
  // Do work here
  const { stdout, stderr } = await exec(cmd);
  console.log("collectCred", target)
  if(stderr){
    console.log('\n\nstderr:\n', stderr);
    return
  }

  console.log('\n\stdout:\n', stdout)

  const cred = await readFile(`${process.env.SOURCECRED_OUTPUT}/projects/${base64url.encode(target)}/cred.json`)

  let res = await client.query(`UPDATE installations SET cred = ($1) WHERE target = ($2)`, [cred, target])

}

const PGPubsub = require('pg-pubsub')
const pubsub = new PGPubsub(process.env.DATABASE_URL)
const { readFile, mkdirp } = require('fs-extra')
const base64url = require("base64url")
const { promisify } = require('util')
const exec = promisify(require('child_process').exec)
const { getInstallationsByTarget, updateInstallationCred } = require('../utils/query')
const { adminJWT } = require("./jwt")

module.exports = {
  start
}

async function start(){
  pubsub.addChannel('new_target', collectCred)
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

  const cred = JSON.parse(await readFile(`${process.env.SOURCECRED_OUTPUT}/projects/${base64url.encode(target)}/cred.json`))

  let installations = await getInstallationsByTarget({jwt: adminJWT, target})
  let res = await Promise.all(installations.map(async ({id})=>await updateInstallationCred({jwt: adminJWT, id, cred})))

}

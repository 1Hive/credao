const fs = require('fs')
const { promisify } = require('util')
const writeFile = promisify(fs.writeFile)
const mkdirp = promisify(require('mkdirp'))
const sleep = promisify(setTimeout)

module.exports = async function(job, done){
  // Do some heavy work
  const repo = job.data.repo
  await sleep(10000)
  await mkdirp(`${process.env.PWD}/data/repos/${repo}`)
  writeFile(`${process.env.PWD}/data/repos/${repo}/cred.json`, JSON.stringify({repo, peaches: "awesome"}))
  done(null, {repo: job.data.repo})
}

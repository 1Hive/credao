const fs = require('fs')
const { mkdirp } = require('fs-extra')
const { promisify } = require('util')
const fetch = require('isomorphic-unfetch');
const sleep = promisify(setTimeout)
const exec = promisify(require('child_process').exec);

module.exports = async function(job, done){
  const id = job.data.id
  const githubToken = job.data.githubToken

  const res = await fetch(`https://api.github.com/repositories/${id}`, { headers: { 'Authorization': `token ${githubToken}` } })
  const repo = await res.json()

  const dir = `${process.env.REPO_DIR}/${id}`
  await mkdirp(dir)

  let cmd = `export SOURCECRED_DIRECTORY=${dir} && export SOURCECRED_GITHUB_TOKEN=${githubToken} && node ${process.env.PWD}/node_modules/sourcecred/bin/sourcecred load ${repo.full_name}`

  console.log(cmd)
  // Do work here
  const { stdout, stderr } = await exec(cmd);
  console.log('\n\nstdout:\n', stdout);
  console.log('\n\nstderr:\n', stderr);

  // writeFile(`${process.env.PWD}/data/repos/${id}/cred.json`, JSON.stringify({id, peaches: "awesome"}))
  done(null, {id: job.data.id})
}

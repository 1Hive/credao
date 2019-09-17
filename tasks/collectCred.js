const { mkdirp } = require('fs-extra')
const { promisify } = require('util')
const exec = promisify(require('child_process').exec);

module.exports = async function(data){
  const target = data.target
  const githubToken = data.githubToken

  const dir = `${process.env.SOURCECRED_OUTPUT}`
  await mkdirp(dir)

  // TODO - using githubToken from user here gives error "GitHub Apps are not allowed access to search"
  // temporarily using personal GITHUB_TOKEN env variable
  let cmd = `export SOURCECRED_DIRECTORY=${dir} && export SOURCECRED_GITHUB_TOKEN=${process.env.GITHUB_TOKEN} && node ${process.env.SOURCECRED_BIN} load ${target}`

  console.log(cmd)
  // Do work here
  const { stdout, stderr } = await exec(cmd);
  console.log("collectCred", target)
  console.log('\n\nstdout:\n', stdout);
  console.log('\n\nstderr:\n', stderr);
}

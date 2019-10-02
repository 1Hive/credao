const fetch = require("isomorphic-unfetch")
const {
  createContributor,
  createInstallation,
  getContributor,
  getInstallationRepos,
  getInstallationByGithubId,
  updateInstallationDAO
} = require("../utils/query")
const { userJWT, adminJWT, githubJWT} = require("./jwt")
const { createDAO } = require('../utils/dao')

module.exports = setup

async function setup(req, res){
  // http://localhost:3000/setup?code=A_USER_CODE&installation_id=1884491&setup_action=install
  if(!req.session.user) return res.send("no user")
  if(!req.query.installation_id) return res.redirect("/")

  const installation = await ensureInstallation({
    user: req.session.user,
    githubInstallationId: parseInt(req.query.installation_id)
  })

  // res.redirect(`/org/${installation.name}`)
  res.redirect(`/dao/#/${installation.dao}`)
}

async function ensureInstallation({user, githubInstallationId}){
  const jwt = adminJWT
  let installation = await getInstallationByGithubId({jwt, githubInstallationId})

  if(!installation){
    const { githubToken, name, target } = await getInstallationDetails(githubInstallationId)
    installation = await createInstallation({jwt, githubInstallationId, githubToken, name, target, ownerId: user.id})
  }

  const installationId = installation.id
  let contributor = await getContributor({jwt, userId: user.id, installationId})

  if(!contributor)
    contributor = await createContributor({jwt, userId: user.id, installationId})
  console.log("contributor", contributor)

  if(!installation.dao){
    const dao = await createDAO({ jwt: user.jwt, userId: user.id, installationId});
    installation = await updateInstallationDAO({jwt: user.jwt, id: installationId, dao})
  }

  return installation
}

async function getInstallationDetails(githubInstallationId){
  let githubToken = await getInstallationGithubToken(githubInstallationId)
  console.log("installation token", githubToken)
  let repos = await getInstallationRepos(githubToken)

  let name, target
  if(!repos.length) {
    // need some repos
  } else if(repos.length === 1) {
    // single repo use repo name as installation name
    name = repos[0].full_name.split("/")[1]
    target = repos[0].full_name
  } else {
    // multiple repos use first org name as installation name
    name = repos[0].owner.login
    target = `@${repos[0].owner.login}`
  }
  return { githubToken, name, target }
}

async function getInstallationGithubToken(githubInstallationId){
  const res = await fetch(`https://api.github.com/app/installations/${githubInstallationId}/access_tokens`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${githubJWT()}`,
      "Accept": "application/vnd.github.machine-man-preview+json"
    }
  })
  const data = await res.json()
  console.log(data)
  return data.token
}

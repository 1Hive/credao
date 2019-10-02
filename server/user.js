const fetch = require("isomorphic-unfetch")
const { GH_ACCESS_TOKEN_URL, GH_USER_URL } = require("../utils/constants")
const { createUser, getUserByGithubId } = require("../utils/query")
const { userJWT, adminJWT } = require("./jwt")

module.exports = user

async function user(req, res, next){
  if(!req.session.user && req.query.code){
    const githubToken = await createGithubToken(req.query.code)
    if(githubToken) await populateSession({session: req.session, jwt: adminJWT, githubToken})
  }
  next()
}

async function createGithubToken(code){
  const res = await fetch(GH_ACCESS_TOKEN_URL, {
    method: "POST",
    headers: {"Content-Type": "application/json", "Accept": "application/json"},
    body: JSON.stringify({
      code,
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET
    })
  })
  return (await res.json()).access_token
}

async function populateSession({session, jwt, githubToken}){
  // use token to get github user
  const res = await fetch(GH_USER_URL, { headers: { 'Authorization': `token ${githubToken}` }})
  const ghUser = await res.json()
  if(!ghUser) return session

  let githubId = ghUser.id
  let username = ghUser.login

  let user = await getUserByGithubId({jwt, githubId})
  if(!user) user = await createUser({jwt, githubId, username})
  if(user) {
    session.user = user
    session.user.githubToken = githubToken
    session.user.jwt = userJWT(user.id)
  }

  return session
}

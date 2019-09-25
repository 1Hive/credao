const { GH_INSTALLATION_REPOS_URL, GH_ACCESS_TOKEN_URL, GH_USER_URL } = require('./constants')
const fetch = require('isomorphic-unfetch')
const { getUserByGithubId, createUser } = require('./query')


module.exports = {
  createGithubToken,
  getUserWithToken
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

async function getUserWithToken(githubToken){
  // use token to get github user
  const res = await fetch(GH_USER_URL, { headers: { 'Authorization': `token ${githubToken}` }})
  const ghUser = await res.json()
  if(!ghUser)
    return null

  let githubId = ghUser.id
  let username = ghUser.login

  let user = await getUserByGithubId({githubId})
  if(!user) user = await createUser({githubId, username})
  user.githubToken = githubToken
  return user
}

import { GH_INSTALLATION_REPOS_URL, GH_ACCESS_TOKEN_URL, GH_USER_URL } from './constants'
import fetch from 'isomorphic-unfetch'
import { gqlQuery } from './'

export async function auth(ctx){
  const {err, req, res, query} = ctx
  console.log("SESSION", req.session)
  if(!req.session.user) {
    if(query.code){
      const ghToken = await createGithubToken(query.code)
      if(!ghToken)
        return null   // TODO redirect /login
      else {
        req.session.githubToken = ghToken
        req.session.user = await getUser(ghToken)
      }
    } else if(req.session.githubToken){
      req.session.user = await getUser(req.session.githubToken)
    } else {
      return null   // TODO redirect /login
    }
  }

  return req.session.user
}

export async function createGithubToken(code){
  const res = await fetch(GH_ACCESS_TOKEN_URL, {
    method: "POST",
    headers: {"Content-Type": "application/json", "Accept": "application/json"},
    body: JSON.stringify({
      code,
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET
    })
  })
  let data = await res.json()
  console.log(data)
  return (data).access_token
}

export async function getUser(token){
  // use token to get github user
  const res = await fetch(GH_USER_URL, { headers: { 'Authorization': `token ${token}` }})
  const ghUser = await res.json()
  if(!ghUser)
    return null

  // query db for existing user
  let query = `
  query {
    userByGithubId(githubId: ${ghUser.id}) {
      id
      username
    }
  }
  `
  let resData = await gqlQuery(query)
  console.log("getUser", resData)
  if(resData.data.userByGithubId)
    return resData.data.userByGithubId

  return await createUser({githubId: ghUser.id, username: ghUser.login})
}

async function createUser({githubId, username}){

  let query = `
  mutation {
    createUser(
      input: { user: { githubId: ${githubId}, username: "${username}" } }
    ) {
      user {
        id
        username
      }
    }
  }`

  let resData = await gqlQuery(query)
  return resData.data.createUser.user

}

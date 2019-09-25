const fetch = require('isomorphic-unfetch')
const { ethers } = require("ethers")
const githubJWT = require('./githubJWT')
const parseLinkHeader = require('parse-link-header')
const { GH_INSTALLATION_REPOS_URL, GH_ACCESS_TOKEN_URL, GH_USER_URL } = require('./constants')

module.exports = {
  getInstallationGithubToken,
  getInstallationRepos,
  createInstallation,
  updateInstallationDAO,
  getUserInstallationsByUserId,
  createInstallationUser,
  getInstallationByGithubId,
  getInstallationById,
  getInstallationByName,
  getInstallationsByTarget,
  updateInstallationCred,
  getInstallationUser,
  createUser,
  getUserByGithubId,
  getUserByUsername,
  getInstallationUserAddress,
  gqlSubmit
}

async function getInstallationGithubToken(githubInstallationId){
  let data = await fetch(`https://api.github.com/app/installations/${githubInstallationId}/access_tokens`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${await githubJWT()}`, "Accept": "application/vnd.github.machine-man-preview+json" }
  })
  return (await data.json()).token
}

async function getInstallationRepos(ghToken){
  let repos = []
  let url = GH_INSTALLATION_REPOS_URL
  while(!!url){
    let res = await fetch(`${GH_INSTALLATION_REPOS_URL}`, {
      headers: { "Authorization": `token ${ghToken}`, "Accept": "application/vnd.github.machine-man-preview+json" }
    })
    let data = await res.json()
    console.log(`${data.total_count} repos`)
    repos = repos.concat( data.repositories )
    let link = parseLinkHeader(res.headers.get("link"))
    url = link && link.next ? link.next.url : null
  }
  return repos
}

async function createInstallation({userId, githubInstallationId, githubToken, name, target, creatorId}){
  let resData = await gqlSubmit(`
    mutation { createInstallation( input: {
          installation: { githubId: ${githubInstallationId}, githubToken: "${githubToken}",
            name: "${name}", target: "${target}", creatorId: ${creatorId} } }
    ) { installation { id name target creatorId } } }`)
  return resData && resData.data.createInstallation.installation
}

async function updateInstallationDAO({id, dao}){
  let resData = await gqlSubmit(`
    mutation { updateInstallationById(input: {installationPatch: {dao: "${dao}"}, id: ${id}}) {
        clientMutationId } }`)
  return resData && resData.data.updateInstallationById.installation
}

async function updateInstallationCred({id, cred}){
  let resData = await gqlSubmit(`
    mutation UpdateCred($cred: JSON!) { updateInstallationById(input: { installationPatch: { cred: $cred }, id: ${id} }) {
        clientMutationId } }`, {cred})
  console.log(resData)
  return resData && resData.data.updateInstallationById.installation
}

async function getUserInstallationsByUserId(userId){
  const resData = await gqlSubmit(`query { userById(id: ${userId}) { id
      installationsByInstallationUserUserIdAndInstallationId {
        nodes { id name target dao cred creatorId } } } }`)
  return resData && resData.data.userById.installationsByInstallationUserUserIdAndInstallationId.nodes
}

async function createInstallationUser({userId, installationId}){
  const resData = await gqlSubmit(`mutation {
    createInstallationUser( input: { installationUser: { userId: ${userId}, installationId: ${installationId} } } ) {
      installationUser { userId installationId address autoAddress autoKey } } }`)
  return resData && resData.data.createInstallationUser.installationUser
}

async function getInstallationByGithubId({githubInstallationId}){
  const resData = await gqlSubmit(`query {
    installationByGithubId(githubId: ${githubInstallationId}) {
      id name target dao cred creatorId } }`)
  return resData && resData.data.installationByGithubId
}

async function getInstallationById({installationId}){
  const resData = await gqlSubmit(`query { installationById(id: ${installationId}) { id name target dao cred creatorId } }`)
  return resData && resData.data.installationById
}

async function getInstallationByName({name}){
  const resData = await gqlSubmit(`query { installationByName(name: "${name}") { id name target dao cred creatorId } }`)
  return resData && resData.data.installationByName
}

async function getInstallationsByTarget({target}){
  const resData = await gqlSubmit(`query MyQuery { allInstallations(condition: {target: "${target}"}) { nodes { id } } }`)
  return resData && resData.data.allInstallations.nodes
}

async function getInstallationUser({userId, installationId}){
  const resData = await gqlSubmit(`query {
    installationUserByInstallationIdAndUserId(userId: ${userId}, installationId: ${installationId}) {
      userId installationId address autoAddress autoKey
      installationByInstallationId { name dao }
    } }`)
  return resData && resData.data.installationUserByInstallationIdAndUserId
}

async function createUser({githubId, username}){
  let inputs = [`username: "${username}"`]
  if(githubId) inputs.push(`githubId: ${githubId}`)
  let resData = await gqlSubmit(`mutation { createUser( input: { user: { ${inputs.join(", ")} } } ) { user { id username } } }`)
  return resData.data.createUser.user
}

async function getUserByGithubId({githubId}){
  let resData = await gqlSubmit(`query { userByGithubId(githubId: ${githubId}) { id username } }`)
  return resData && resData.data.userByGithubId
}

async function getUserByUsername({username}){
  let resData = await gqlSubmit(`query { userByUsername(username: "${username}") { id } }`)
  return resData && resData.data.userByUsername
}

async function getInstallationUserAddress({username, installationId}){
  let user = await getUserByUsername({username})
  if(!user) user = await createUser({username})

  let installationUser = await getInstallationUser({userId: user.id, installationId})
  if(!installationUser) installationUser = await createInstallationUser({userId: user.id, installationId})

  return installationUser.address || installationUser.autoAddress
}

async function gqlSubmit(query, variables){
  let baseURL = ''
  if(typeof window === "undefined")
    baseURL = process.env.BASE_URL

  let body = {query, variables}
  console.log(body)
  let res = await fetch(`${baseURL}/graphql`, {
    method: "POST",
    headers: {"Content-Type": "application/json", "Accept": "application/json"},
    body: JSON.stringify(body)
  })
  return (await res.json())
}

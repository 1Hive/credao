const fetch = require('isomorphic-unfetch')
const { ethers } = require("ethers")
const parseLinkHeader = require('parse-link-header')
const { GH_INSTALLATION_REPOS_URL, GH_ACCESS_TOKEN_URL, GH_USER_URL } = require('./constants')

module.exports = {
  getInstallationRepos,
  createInstallation,
  updateInstallationDAO,
  getUserInstallationsByUserId,
  createContributor,
  getInstallationByGithubId,
  getInstallationById,
  getInstallationByName,
  getInstallationsByTarget,
  updateInstallationCred,
  getContributor,
  createUser,
  getUserByGithubId,
  getUserByUsername,
  getContributorAddress,
  gqlSubmit
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

async function createInstallation({jwt, githubInstallationId, githubToken, name, target, ownerId}){
  let resData = await gqlSubmit(jwt, `
    mutation CreateInstallation($githubId: Int!, $githubToken: String!, $name: String!, $target: String!, $ownerId: Int!) {
      createInstallation( input: {
          installation: { githubId: $githubId, githubToken: $githubToken, name: $name, target: $target, ownerId: $ownerId } }
    ) { installation { id name target ownerId } } }
  `, {githubId: githubInstallationId, githubToken, name, target, ownerId})
  return resData && resData.data.createInstallation.installation
}

async function updateInstallationDAO({jwt, id, dao}){
  let resData = await gqlSubmit(jwt, `
    mutation UpdateInstallation($id: Int!, $dao: String!) {
      updateInstallationById(input: {installationPatch: {dao: $dao}, id: $id}) {
        clientMutationId } }
  `, {id, dao})
  return resData && resData.data.updateInstallationById.installation
}

async function updateInstallationCred({jwt, id, cred}){
  let resData = await gqlSubmit(jwt, `
    mutation UpdateCred($cred: JSON!) { updateInstallationById(input: { installationPatch: { cred: $cred }, id: ${id} }) {
        clientMutationId } }`
  , {cred})
  console.log(resData)
  return resData && resData.data.updateInstallationById.installation
}

async function getUserInstallationsByUserId({jwt, id}){
  const resData = await gqlSubmit(jwt, `
    query GetUserInstallations($id: Int!) { userById(id: $id) { id
      installationsByContributorUserIdAndInstallationId {
        nodes { id name target dao cred ownerId } } } }
  `, {id})
  return resData && resData.data.userById.installationsByContributorUserIdAndInstallationId.nodes
}

async function createContributor({jwt, userId, installationId}){
  const resData = await gqlSubmit(jwt, `
    mutation CreateContributor($userId: Int!, $installationId: Int!) {
      createContributor( input: { contributor: { userId: $userId, installationId: $installationId } } ) {
        contributor { userId installationId address autoAddress autoKey } } }
  `, {userId, installationId})
  return resData && resData.data.createContributor.contributor
}

async function getInstallationByGithubId({jwt, githubInstallationId}){
  const resData = await gqlSubmit(jwt, `
    query GetInstallation($githubId: Int!) { installationByGithubId(githubId: $githubId) {
      id name target dao cred ownerId } }
  `, {githubId: githubInstallationId})
  return resData && resData.data.installationByGithubId
}

async function getInstallationById({jwt, id}){
  const resData = await gqlSubmit(jwt, `
    query GetInstallation($id: Int!) { installationById(id: $id) { id name target dao cred ownerId } }
  `, {id})
  return resData && resData.data.installationById
}

async function getInstallationByName({jwt, name}){
  const resData = await gqlSubmit(jwt, `
    query GetInstallation($name: String!) {
      installationByName(name: $name) { id name target dao cred ownerId } }
  `, {name})
  return resData && resData.data.installationByName
}

async function getInstallationsByTarget({jwt, target}){
  const resData = await gqlSubmit(jwt, `
    query GetInstallations($target: String!) { allInstallations(condition: {target: $target}) { nodes { id } } }
  `, {target})
  return resData && resData.data.allInstallations.nodes
}

async function getContributor({jwt, userId, installationId}){
  const resData = await gqlSubmit(jwt, `
    query GetContributor($userId: Int!, $installationId: Int!) {
      contributorByInstallationIdAndUserId(userId: $userId, installationId: $installationId) {
        userId installationId address autoAddress autoKey
        installationByInstallationId { name dao } } }
  `, {userId, installationId})
  return resData && resData.data.contributorByInstallationIdAndUserId
}

async function createUser({jwt, githubId, username}){
  let resData = await gqlSubmit(jwt, `
    mutation CreateUser($username: String!, $githubId: Int) {
      createUser( input: { user: { username: $username, githubId: $githubId } } ) {
        user { id username }
    }}
  `, {githubId, username})
  return resData && resData.data.createUser.user
}

async function getUserByGithubId({jwt, githubId}){
  let resData = await gqlSubmit(jwt, `
    query GetUser($githubId: Int!) {
      userByGithubId(githubId: $githubId) { id username } }
  `, {githubId})
  return resData && resData.data.userByGithubId
}

async function getUserByUsername({jwt, username}){
  let resData = await gqlSubmit(jwt, `
    query GetUser($username: String!) { userByUsername(username: $username) { id } }
  `, {username})
  return resData && resData.data.userByUsername
}

async function getContributorAddress({jwt, username, installationId}){
  let resData = await gqlSubmit(jwt, `
    mutation EnsureContributor($installationId: Int!, $username: String!) {
      ensureContributorFromUsername(input: {installationId: $installationId, username: $username}) {
        contributor { address autoAddress autoKey }
      }
    }
  `, {username, installationId})
  const contributor = resData.data.ensureContributorFromUsername.contributor

  return contributor.address || contributor.autoAddress
}

async function gqlSubmit(jwt, query, variables){
  let baseURL = ''
  if(typeof window === "undefined")
    baseURL = process.env.BASE_URL

  let options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": jwt ? `Bearer ${jwt}` : ""
    },
    body: JSON.stringify({query, variables})
  }
  // console.log(JSON.stringify(options))

  let res = await fetch(`${baseURL}/graphql`, options)
  res = await res.json()
  // console.log(JSON.stringify(res))
  if(res.errors) console.log(JSON.stringify(res))
  return res
}

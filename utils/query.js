const fetch = require('isomorphic-unfetch')
const { ethers } = require("ethers")

export async function createInstallationUser({userId, installationId}){
  let installationUser = await getInstallationUser({userId, installationId})
  if(installationUser) return installationUser

  const wallet = ethers.Wallet.createRandom()

  const resData = await gqlSubmit(`
  mutation {
    createInstallationUser( input: { installationUser: { userId: ${userId}, installationId: ${installationId}, autoKey: "${wallet.privateKey}" } } ) {
      installationUser { userId installationId address autoKey }
    }
  }`)

  return resData && resData.data.createInstallationUser.installationUser
}

export async function getInstallation({installationId}){
  const resData = await gqlSubmit(`query { installationById(id: ${installationId}) { id name target dao } }`)
  return resData && resData.data.installationById
}

export async function getInstallationUser({userId, installationId}){
  const resData = await gqlSubmit(`
  query {
    installationUserByInstallationIdAndUserId(userId: ${userId}, installationId: ${installationId}) {
      userId installationId address autoKey
    }
  }
  `)
  return resData && resData.data.installationUserByInstallationIdAndUserId
}

export async function createUser({username}){
  let user = await getUserByUsername({username})
  if(user) return user

  let resData = await gqlSubmit(`mutation { createUser( input: { user: { username: "${username}" } } ) { user { id } } }`)
  return resData.data.createUser.user
}

export async function getUserByUsername({username}){
  let resData = await gqlSubmit(`
  query { userByUsername(username: "${username}") { id } }`)
  console.log(resData)
  return resData && resData.data.userByUsername
}

export async function gqlSubmit(query){
  let baseURL = ''
  if(typeof window === "undefined")
    baseURL = process.env.BASE_URL

  let res = await fetch(`${baseURL}/graphql`, {
    method: "POST",
    headers: {"Content-Type": "application/json", "Accept": "application/json"},
    body: JSON.stringify({query})
  })
  return (await res.json())
}

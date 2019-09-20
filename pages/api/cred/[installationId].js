const hash = require('hash.js')
const { readFile, readdir } = require('fs-extra')
const base64url = require("base64url")
const { COLLECT_CRED_QUEUE } = require('../../../utils/constants')
const { ethers } = require("ethers")

export default async(req, res) => {
  const installationId = req.query['installationId']

  const installation = await getInstallation({installationId})
  const target = installation.target//base64url.decode(encodedTarget)
  const encodedTarget = base64url.encode(target)//req.query['encodedTarget']
  const taskKey = `${target}@${new Date().toISOString().slice(0,10)}`
  const githubToken = req.query['githubToken']
  let resData

  console.log(target, encodedTarget, githubToken)

  try {
    let data = await collateCred(encodedTarget)
    console.log(Object.keys(data.points))
    await Promise.all(Object.keys(data.points).map(async (username)=>{
      const user = await createUser({username})
      await createInstallationUser({userId: user.id, installationId})
    }))
    resData = {data}
  } catch(e){
    console.log(e)
    let job = await req.boss.publishOnce(COLLECT_CRED_QUEUE, {target, githubToken}, null, taskKey)
    resData = {job, data: null}
  }

  res.setHeader('Content-Type', 'application/json')
  res.statusCode = 200
  res.end(JSON.stringify(resData))
}

async function collateCred(encodedTarget){
  const data = JSON.parse(await readFile(`${process.env.SOURCECRED_OUTPUT}/projects/${encodedTarget}/cred.json`))
  // console.log(data)
  const points = {}
  const cred = data[1].credJSON
  for (let user in cred){
    let nameArr = user.split('\0')
    if(!nameArr.includes('USER')) continue
    let name = nameArr[nameArr.length-2]
    points[name] = cred[user].reduce((a, b) => a + b, 0)
  }
  let intervals = data[1].intervalsJSON
  return {
    points,
    start: intervals[0].startTimeMs,
    end: intervals[intervals.length - 1].endTimeMs
  }
}

export async function createInstallationUser({userId, installationId}){
  let installationUser = await getInstallationUser({userId, installationId})
  if(installationUser) return installationUser

  const wallet = ethers.Wallet.createRandom()

  const resData = await gqlQuery(`
  mutation {
    createInstallationUser( input: { installationUser: { userId: ${userId}, installationId: ${installationId}, autoKey: "${wallet.privateKey}" } } ) {
      installationUser {
        userId
        installationId
        address
        autoKey
      }
    }
  }`)

  return resData && resData.data.createInstallationUser.installationUser
}

async function getInstallation({installationId}){
  const resData = await gqlQuery(`
  query {
    installationById(id: ${installationId}) {
      id
      name
      target
      dao
    }
  }
  `)
  return resData && resData.data.installationById
}

export async function getInstallationUser({userId, installationId}){
  const resData = await gqlQuery(`
  query {
    installationUserByInstallationIdAndUserId(userId: ${userId}, installationId: ${installationId}) {
      userId
      installationId
      address
      autoKey
    }
  }
  `)
  return resData && resData.data.installationUserByInstallationIdAndUserId
}

async function createUser({username}){
  let user = await getUserByUsername({username})
  if(user) return user

  let resData = await gqlQuery(`
  mutation {
    createUser(
      input: { user: { username: "${username}" } }
    ) {
      user {
        id
      }
    }
  }`)
  return resData.data.createUser.user
}

async function getUserByUsername({username}){
  let resData = await gqlQuery(`
  query {
    userByUsername(username: "${username}") {
      id
    }
  }`)
  console.log(resData)
  return resData && resData.data.userByUsername
}

async function gqlQuery(query){
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

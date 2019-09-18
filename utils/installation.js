import fetch from 'isomorphic-unfetch'
import githubJWT from './githubJWT'
import parseLinkHeader from 'parse-link-header'
import { ethers } from "ethers"
const SAMPLE_PRIVATE_KEY = "a8a54b2d8197bc0b19bb8a084031be71835580a01e70a45a13babd16c9bc1563"
import { GH_INSTALLATION_REPOS_URL, GH_ACCESS_TOKEN_URL, GH_USER_URL } from './constants'
import { gqlQuery } from './'

export async function getInstallation({user, githubId}){
  let query = `
  query {
    installationByGithubId(githubId: ${githubId}) {
      id
      name
      target
      dao
      creatorId
    }
  }
  `
  const resData = await gqlQuery(query)
  console.log(resData)
  if(resData.data.installationByGithubId)
    return resData.data.installationByGithubId

  const installation = await createInstallation({user, githubId})

  const installationUser = await createInstallationUser({userId: installation.creatorId, installationId: installation.id})
  console.log("installationUser", installationUser)

  return installation
}

export async function getUserInstallation({userId, installationId}){
  let query = `
  query {
    installationUserByInstallationIdAndUserId(userId: ${userId}, installationId: ${installationId}) {
      address
      autoKey
      installationByInstallationId {
        name
        dao
      }
    }
  }
  `

  let resData = await gqlQuery(query)
  console.log(resData)
  return resData.data.installationUserByInstallationIdAndUserId
}

export async function getUserInstallationsByUserId(userId){
  let query = `
  query {
    userById(id: ${userId}) {
      id
      installationsByInstallationUserUserIdAndInstallationId {
        nodes {
          id
          name
          target
        }
      }
    }
  }
  `

  let resData = await gqlQuery(query)
  return resData.data.userById.installationsByInstallationUserUserIdAndInstallationId.nodes
}

async function createInstallationUser({userId, installationId}){
  const wallet = ethers.Wallet.createRandom()

  let query = `
  mutation {
    createInstallationUser( input: { installationUser: { userId: ${userId}, installationId: ${installationId}, autoKey: "${wallet.privateKey}" } } ) {
      installationUser {
        userId
        installationId
        address
        autoKey
      }
    }
  }`

  let resData = await gqlQuery(query)
  await gasTopup(wallet.address)
  return resData.data.createInstallationUser.installationUser
}

async function gasTopup(to){
  let provider = new ethers.providers.JsonRpcProvider("http://localhost:8545")
  let wallet = (new ethers.Wallet(SAMPLE_PRIVATE_KEY)).connect(provider)
  let value = ethers.utils.parseEther('0.1');
  let tx = await wallet.sendTransaction({ to, value });
  await tx.wait()
}

async function createInstallation({user, githubId}){
  let data = await fetch(`https://api.github.com/app/installations/${githubId}/access_tokens`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${await githubJWT()}`,
      "Accept": "application/vnd.github.machine-man-preview+json"
    }
  })
  let ghToken = (await data.json()).token
  console.log("installation token", ghToken)
  let repos = await getInstallationRepos(ghToken)

  let name, target
  if(!repos.length) {
    return null
  } else if(repos.length === 1) {
    // single repo use repo name as installation name
    name = repos[0].full_name.split("/")[1]
    target = repos[0].full_name
  } else {
    // multiple repos use first org name as installation name
    name = repos[0].owner.login
    target = `@${repos[0].owner.login}`
  }

  let query = `
  mutation {
    createInstallation(
      input: {
        installation: {
          githubId: ${githubId}, githubToken: "${ghToken}", name: "${name}",
          target: "${target}", creatorId: ${user.id}
        }
      }
    ) {
      installation {
        id
        name
        target
        creatorId
      }
    }
  }`

  let resData = await gqlQuery(query)
  return resData.data.createInstallation.installation
}

export async function updateInstallationDAO({id, dao}){
  let query = `
  mutation {
    updateInstallationById(input: {installationPatch: {dao: "${dao}"}, id: ${id}}) {
      clientMutationId
    }
  }
  `

  let resData = await gqlQuery(query)
  return resData.data.updateInstallationById.installation
}

async function getInstallationRepos(ghToken){
  let repos = []
  let url = GH_INSTALLATION_REPOS_URL
  while(!!url){
    let res = await fetch(`${GH_INSTALLATION_REPOS_URL}`,
      { headers:
        {
          "Authorization": `token ${ghToken}`,
          "Accept": "application/vnd.github.machine-man-preview+json"
        }
      }
    )
    let data = await res.json()
    console.log(`${data.total_count} repos`)
    repos = repos.concat( data.repositories )
    let link = parseLinkHeader(res.headers.get("link"))
    url = link && link.next ? link.next.url : null
  }
  return repos
}

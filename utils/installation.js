import fetch from 'isomorphic-unfetch'
import githubJWT from './githubJWT'
import parseLinkHeader from 'parse-link-header'
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

async function createInstallationUser({userId, installationId}){

  let query = `
  mutation {
    createInstallationUser( input: { installationUser: { userId: ${userId}, installationId: ${installationId} } } ) {
      installationUser {
        userId
        installationId
        address
      }
    }
  }`

  let resData = await gqlQuery(query)
  return resData.data.createInstallationUser.installationUser

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

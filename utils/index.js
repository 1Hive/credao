import base64url from 'base64url'
import fetch from 'isomorphic-unfetch'

export async function getCred({target, githubToken}){
  let res = await fetch(`/api/cred/${base64url(target)}?githubToken=${githubToken}`)
  res = await res.json()
  if(res.job){
    await timeout(10000)
    return await getCred({target, githubToken})
  } else
    return res.data
}

export async function timeout(ms){
  return await new Promise(resolve => setTimeout(resolve, ms));
}

export async function gqlQuery(query){
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

import fetch from 'isomorphic-unfetch'

export async function getCred({installationId, githubToken}){
  let res = await fetch(`/api/cred/${installationId}?githubToken=${githubToken}`)
  res = await res.json()
  if(res.job){
    await timeout(10000)
    return await getCred({installationId, githubToken})
  } else
    return res.data
}

export async function timeout(ms){
  return await new Promise(resolve => setTimeout(resolve, ms));
}

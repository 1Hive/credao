import { GH_INSTALLATION_REPOS, GH_ACCESS_TOKEN_URL, GH_USER_URL } from './constants'
import parseLinkHeader from 'parse-link-header';
import { parseCookies } from 'nookies'

export async function auth(ctx){
  const {err, req, res, query} = ctx
  const cookies = parseCookies(ctx)
  let token = cookies["githubToken"]
  if(!token && query.code) {
    token = await createToken(query.code)
    if(!token)
      return null
    else
      setTokenCookie(ctx, token)
  }

  return await {name: await getUser(token), token}
}

export async function createToken(code){
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

export async function getUser(token){
  const res = await fetch(GH_USER_URL, { headers: { 'Authorization': `token ${token}` }})
  return (await res.json()).login
}

export async function createInstallationToken(id){
  // https://api.github.com/app/installations/:installation_id/access_tokens
  const res = await fetch(`https://api.github.com/app/installations/${id}/access_tokens`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.GITHUB_JWT}`,
      "Accept": "application/vnd.github.machine-man-preview+json"
    }
  })
  let data = await res.json()
  // console.log(data)
  return data.token
}

export function setTokenCookie(ctx, token=''){
  const {req, res} = ctx
  // console.log(req)
  const isSecure = req.headers['x-forwarded-proto'] === 'https'

  let cookie = `githubToken=${token}; SameSite=Strict; HttpOnly`

  if (isSecure) {
    cookie = `${cookie}; Secure`
  }

  res.setHeader('Set-Cookie', cookie)

  return cookie
}

export async function getInstallationRepos(token){
  // console.log(token)
  let repos = []
  let url = GH_INSTALLATION_REPOS
  while(!!url){
    let res = await fetch(`${GH_INSTALLATION_REPOS}`,
      { headers:
        {
          "Authorization": `token ${token}`,
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

export async function getCred(id, repos){
  let res = await fetch(`/api/cred/${id}?repos=${repos.join(",")}`)
  res = await res.json()
  if(res.job){
    await timeout(10000)
    return await getCred(id, repos)
  } else
    return res.data
}

async function timeout(ms){
  return await new Promise(resolve => setTimeout(resolve, ms));
}

const express = require("express")
const session = require("express-session")
const next = require("next")
const { postgraphile } = require("postgraphile")
const fetch = require("isomorphic-unfetch")
const PgManyToManyPlugin = require("@graphile-contrib/pg-many-to-many")
const PostGraphileDerivedFieldPlugin = require("postgraphile-plugin-derived-field")
const { GH_ACCESS_TOKEN_URL, GH_USER_URL, GH_OAUTH_URL } = require("../utils/constants")
const derivedFieldDefinitions = require("../utils/derivedFields")
const { userJWT, adminJWT, githubJWT} = require("./jwt")
const {
  getUserByGithubId,
  createUser,
  getInstallationRepos,
  createInstallation,
  getInstallationByGithubId,
  getInstallationUser,
  createInstallationUser
} = require("../utils/query")
const targets = require("./targets")
const githubOAuth = `${GH_OAUTH_URL}?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=http://localhost:4000/setup`

const dev = process.env.NODE_ENV !== "production"
const app = next({ dev })
const handle = app.getRequestHandler()

main()

async function main(){

  await targets.start()
  await app.prepare()
  const server = express()

  server.use(session({
    store: new (require("connect-pg-simple")(session))(),
    secret: process.env.SESSION_SECRET,
    resave: false,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }, // 30 days
    saveUninitialized: false
  }))

  server.use(postgraphile(process.env.DATABASE_URL,"public", {
    watchPg: true,
    graphiql: true,
    enhanceGraphiql: true,
    dynamicJson: true,
    appendPlugins: [PostGraphileDerivedFieldPlugin, PgManyToManyPlugin],
    graphileBuildOptions: { derivedFieldDefinitions },
    bodySizeLimit: "1MB",
    jwtSecret: process.env.JWT_SECRET,
    pgDefaultRole: "default_role",
    jwtPgTypeIdentifier: "public.jwt_token",
    jwtVerifyOptions: {
      audience: "credao"
    }
  }))

  server.use("/dao", express.static(`${process.env.PWD}/node_modules/aragon/build`));

  server.get("/setup", user, async (req, res)=>{
    // http://localhost:3000/setup?code=A_USER_CODE&installation_id=1884491&setup_action=install
    if(!req.session.user) return res.send("no user")
    if(!req.query.installation_id) return res.redirect("/")

    const installation = await getInstallation({
      userId: req.session.user.id,
      githubInstallationId: parseInt(req.query.installation_id)
    })

    res.redirect(`/org/${installation.name}`)
  })

  server.get("/auth", user, async (req, res)=>{
    res.json(req.session.user)
  })

  server.get("/sign-in", (req, res)=>{
    res.redirect(githubOAuth)
  })

  server.get("/sign-out", (req, res)=>{
    req.session.destroy()
    res.redirect("/")
  })

  server.get("*", handle)

  server.listen(process.env.PORT, err => {
    if (err) throw err
    let baseURL = `http://localhost:${process.env.PORT}`
    console.log(`> Ready on ${baseURL}`)
    process.env.BASE_URL = baseURL
    // createUser({jwt: adminJWT, username: `peach-${Math.random().toFixed(4)*10000}`})
  })

}

async function user(req, res, next){
  if(!req.session.user && req.query.code){
    const githubToken = await createGithubToken(req.query.code)
    if(githubToken) await populateSession({session: req.session, jwt: adminJWT, githubToken})
  }
  next()
}

async function getInstallation({userId, githubInstallationId}){
  const jwt = adminJWT
  let installation = await getInstallationByGithubId({jwt, githubInstallationId})

  if(!installation){
    const { githubToken, name, target } = await getInstallationDetails(githubInstallationId)
    installation = await createInstallation({jwt, githubInstallationId, githubToken, name, target, ownerId: userId})
  }

  const installationId = installation.id
  let installationUser = await getInstallationUser({jwt, userId, installationId})

  if(!installationUser)
    installationUser = await createInstallationUser({jwt, userId, installationId})
  console.log("installationUser", installationUser)

  return installation
}

async function getInstallationDetails(githubInstallationId){
  let githubToken = await getInstallationGithubToken(githubInstallationId)
  console.log("installation token", githubToken)
  let repos = await getInstallationRepos(githubToken)

  let name, target
  if(!repos.length) {
    // need some repos
  } else if(repos.length === 1) {
    // single repo use repo name as installation name
    name = repos[0].full_name.split("/")[1]
    target = repos[0].full_name
  } else {
    // multiple repos use first org name as installation name
    name = repos[0].owner.login
    target = `@${repos[0].owner.login}`
  }
  return { githubToken, name, target }
}

async function getInstallationGithubToken(githubInstallationId){
  let data = await fetch(`https://api.github.com/app/installations/${githubInstallationId}/access_tokens`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${githubJWT()}`,
      "Accept": "application/vnd.github.machine-man-preview+json"
    }
  })
  return (await data.json()).token
}

async function createGithubToken(code){
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

async function populateSession({session, jwt, githubToken}){
  // use token to get github user
  const res = await fetch(GH_USER_URL, { headers: { 'Authorization': `token ${githubToken}` }})
  const ghUser = await res.json()
  if(!ghUser) return session

  let githubId = ghUser.id
  let username = ghUser.login

  let user = await getUserByGithubId({jwt, githubId})
  if(!user) user = await createUser({jwt, githubId, username})
  if(user) {
    session.user = user
    session.user.githubToken = githubToken
    session.user.jwt = userJWT(user.id)
  }

  return session
}

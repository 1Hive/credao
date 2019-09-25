const express = require('express')
const session = require('express-session')
const next = require('next')
const { postgraphile } = require('postgraphile')
const fetch = require('isomorphic-unfetch')
const PgManyToManyPlugin = require("@graphile-contrib/pg-many-to-many");
const PostGraphileDerivedFieldPlugin = require("postgraphile-plugin-derived-field");
const { COLLECT_CRED_QUEUE, GH_OAUTH_URL } = require('../utils/constants')
const derivedFieldDefinitions = require('../utils/derivedFields')
const {
  getInstallationGithubToken,
  getInstallationRepos,
  createInstallation,
  getInstallationByGithubId,
  getInstallationUser,
  createInstallationUser
} = require('../utils/query')
const { createGithubToken, getUserWithToken } = require('../utils/auth')
const targets = require('./targets')
const githubJWT = require('../utils/githubJWT')
const githubOAuth = `${GH_OAUTH_URL}?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=http://localhost:4000/setup`

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

main()

async function main(){

  await targets.start()
  await app.prepare()
  const server = express()

  server.use(session({
    store: new (require('connect-pg-simple')(session))(),
    secret: process.env.SESSION_SECRET,
    resave: false,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }, // 30 days
    saveUninitialized: false
  }))

  server.use(postgraphile(process.env.DATABASE_URL,'public', {
    watchPg: true,
    graphiql: true,
    enhanceGraphiql: true,
    dynamicJson: true,
    appendPlugins: [PostGraphileDerivedFieldPlugin, PgManyToManyPlugin],
    graphileBuildOptions: { derivedFieldDefinitions }
  }))

  server.use("/dao", express.static(`${process.env.PWD}/node_modules/aragon/build`));

  server.get('/installation', async (req, res)=>{
    const userId = req.query.user_id
    const githubInstallationId = req.query.github_installation_id

    return res.json( await getInstallation({userId, githubInstallationId}) )
  })

  server.get('/auth', async (req, res)=>{
    console.log(req.query)
    if(!req.session.user){
      if(req.query.code) {
        const githubToken = await createGithubToken(req.query.code)
        if(githubToken) {
          req.session.user = await getUserWithToken(githubToken)
        } else {
          return res.json(null)
        }
      } else return res.json(null)
    }

    return res.json(req.session.user)
  })

  server.get('/sign-in', (req, res)=>{
    res.redirect(githubOAuth)
  })

  server.get('/sign-out', (req, res)=>{
    req.session.destroy()
    res.redirect('/')
  })

  server.get('*', handle)

  server.listen(process.env.PORT, err => {
    if (err) throw err
    let baseURL = `http://localhost:${process.env.PORT}`
    console.log(`> Ready on ${baseURL}`)
    process.env.BASE_URL = baseURL
  })

}

async function getInstallation({userId, githubInstallationId}){
  let installation = await getInstallationByGithubId({githubInstallationId})

  if(!installation){
    const { githubToken, name, target } = await getInstallationDetails(githubInstallationId)
    installation = await createInstallation({githubInstallationId, githubToken, name, target, creatorId: userId})
  }

  const installationId = installation.id
  let installationUser = await getInstallationUser({userId, installationId})

  if(!installationUser)
    installationUser = await createInstallationUser({userId, installationId})
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

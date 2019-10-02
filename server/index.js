const express = require("express")
const session = require("express-session")
const boom = require('express-boom')
const cors = require('cors')
const next = require("next")
const { postgraphile } = require("postgraphile")
const PgManyToManyPlugin = require("@graphile-contrib/pg-many-to-many")
const ipfsClient = require('ipfs-http-client')
const { ProtectAutoKeyPlugin } = require("./plugins")
const { GH_OAUTH_URL } = require("../utils/constants")
const { userJWT, adminJWT } = require("./jwt")
const { getInstallationByDAO, getContributor } = require("../utils/query")
const targets = require("./targets")
const setup = require("./setup")
const user = require("./user")
const cred = require("./cred")

let ipfs = ipfsClient('/ip4/127.0.0.1/tcp/5001')
const dev = process.env.NODE_ENV !== "production"
const app = next({ dev })
const handle = app.getRequestHandler()

main()

async function main(){

  await targets.start()
  await app.prepare()
  const server = express()

  server.use(boom())

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
    appendPlugins: [ProtectAutoKeyPlugin, PgManyToManyPlugin],
    bodySizeLimit: "1MB",
    jwtSecret: process.env.JWT_SECRET,
    pgDefaultRole: "default_role",
    jwtPgTypeIdentifier: "public.jwt_token",
    jwtVerifyOptions: { audience: "credao" }
  }))

  server.use((req, res, next)=>{
    req.ipfs = ipfs
    next()
  })

  server.use("/dao", express.static(`${process.env.PWD}/aragon/build`))

  server.get("/cred", cors(), cred)

  server.get("/setup", user, setup)

  server.get("/auth", user, async (req, res)=>res.json(req.session.user))

  server.get("/contributor", user, async (req, res)=>{
    const dao = req.query.dao
    const u = req.session.user
    if(!u || !dao) return res.json(null)

    const installation = await getInstallationByDAO({jwt: u.jwt, dao})
    const {address, autoAddress, autoKey} = await getContributor({
      jwt: u.jwt,
      userId: u.id,
      installationId: installation.id
    })
    res.json({address, autoAddress, autoKey})
  })

  server.get("/sign-in", (req, res)=>{
    res.redirect(`${GH_OAUTH_URL}?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${process.env.OAUTH_REDIRECT_URI}`)
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
    // createContributor({jwt: adminJWT, userId:1, installationId:1}).then(console.log)
    // getContributor({jwt: userJWT(999), userId:1, installationId:1}).then(console.log)
  })

}

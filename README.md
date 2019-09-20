# credao

This is super early days for this project. Just a barely working, very insecure, proof of concept!

Credao is a Github App. The [rough] goal is to enable github users to install the app to their org or repo and have an Aragon dao automatically made. SourceCred cred is retrieved and used as a metric for airdropping tokens into the Aragon dao. A modified version of the Aragon client is hosted and serves to facilitate use without the user having any initial understanding of Ethereum keys.

stuff kind of done/working in some fashion:
* a [db schema](db.sql)
* a [next.js](https://nextjs.org/) app
* [PostGraphile](https://www.graphile.org/postgraphile/) graphql interface for data access/manipulation
* retrieve cred using [pg-boss](https://www.npmjs.com/package/pg-boss) job queue
* create dao with [airdrop template](https://github.com/1Hive/airdrop-app/blob/master/contracts/Template.sol)
* create wallets for potential airdrop recipients

stuff not done:
* counterfactual wallets and embedding into modified aragon client
* backend security/access restriction
* [todo.md](todo.md)
* design, much consideration for ux

stuff being worked on:
* airdropping cred diffs

## Probably this will not work:

1. clone and `yarn`
1. `npm run db:setup` (need postgres installed)
1. create `.env` file with following (filled in):

```
export GITHUB_APP_ID=                                                   # github app id assigned to app you created
export GITHUB_CLIENT_ID=                                                # github client id assigned to app you created
export GITHUB_CLIENT_SECRET=                                            # github app secret assigned to app you created
export GITHUB_TOKEN=                                                    # a _user_ github access token for running sourcecred
export SESSION_SECRET=                                                  # some secret phrase, put anything here
export SOURCECRED_BIN=/some_path_to/sourcecred/bin/sourcecred           # path to sourcecred binary
export SOURCECRED_OUTPUT=$PWD/data/cred
export KEY_PATH=$PWD/some_private_key.pem                               # for json web token
export DATABASE_URL=postgres://postgres:postgres@localhost:5432/credao
export PORT=4000
```

4. `npm run dev`

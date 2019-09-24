# credao

This is super early days for this project. Just a barely working, very insecure, proof of concept!

Credao is a Github App. The [rough] goal is to enable github users to install the app to their org or repo and have an Aragon dao automatically made. SourceCred cred is retrieved and used as a metric for airdropping tokens into the Aragon dao. A modified version of the Aragon client is hosted and serves to facilitate use without the user having any initial understanding of Ethereum keys.

kind of done/working in some fashion:
* a [db schema](db.sql)
* a [next.js](https://nextjs.org/) app
* [PostGraphile](https://www.graphile.org/postgraphile/) graphql interface for data access/manipulation
* create dao with [airdrop template](https://github.com/1Hive/airdrop-app/blob/master/contracts/Template.sol)
* autogen wallets for airdrop recipients

not done:
* counterfactual wallets
* aragon client modified to use counterfactual wallets
* backend security/access restriction
* [todo.md](todo.md)
* design, much consideration for ux

being worked on:
* airdropping cred diffs

#### Probably this will not work:

1. clone and `yarn`
1. create `.env` file with following (filled in):

```
export GITHUB_APP_ID=                                                   # github app id assigned to app you created
export GITHUB_CLIENT_ID=                                                # github client id assigned to app you created
export GITHUB_CLIENT_SECRET=                                            # github app secret assigned to app you created
export GITHUB_TOKEN=                                                    # a _user_ github access token for running sourcecred
export SESSION_SECRET=keyboard cat                                      # some secret phrase, put anything here
export SOURCECRED_BIN=/some_path_to/sourcecred/bin/sourcecred           # path to sourcecred binary
export SOURCECRED_OUTPUT=$PWD/data/cred
export KEY_PATH=$PWD/some_private_key.pem                               # for json web token
export PGUSER=postgres
export PGPASSWORD=postgres
export DATABASE_URL=postgres://$PGUSER:$PGPASSWORD@localhost:5432/credao
export PORT=4000
```

3. `npm run db:setup` (need postgres installed)
4. `npm run dev`

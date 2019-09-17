const PgBoss = require('pg-boss')
const boss = new PgBoss(process.env.DATABASE_URL)
const COLLECT_CRED_QUEUE = 'collect-cred'
const collectCred = require('../processors/collectCred')

// boss.on('error', error => console.error(error));

module.exports.startBoss = async function(){
  console.log("RUNNING BOSS")
  await boss.start()
  await boss.subscribe(COLLECT_CRED_QUEUE, collectCred)
}
module.exports.boss = boss
module.exports.COLLECT_CRED_QUEUE = COLLECT_CRED_QUEUE

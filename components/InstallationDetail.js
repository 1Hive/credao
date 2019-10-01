import React, { useState, useEffect, useContext } from 'react'
import Link from 'next/link'
import { Anchor, Box, Button, Heading, Paragraph, Text } from 'grommet'
import { Card, Notification } from 'grommet-controls'
import { Deploy } from 'grommet-icons';
import Loading from './Loading'
import Layout from './Layout'
import UserContext from './UserContext';
import CreateDAO from './CreateDAO';
import CredDiff from './CredDiff';
import { collateCred, ipfsFetch } from '../utils'
import { getInstallationByName } from '../utils/query'
import { create as createDAO, getAirdropper, airdrop }  from '../utils/dao'

function InstallationDetail(props){
  const { user } = useContext(UserContext)
  const [cred, setCred] = useState(props.cred)
  const [dao, setDao] = useState(props.dao)
  const [airdropper, setAirdropper] = useState()
  const [count, setCount] = useState()
  const [latest, setLatest] = useState()
  const [diff, setDiff] = useState()
  const [showCred, setShowCred] = useState()
  const [dropped, setDropped] = useState()

  useEffect(()=>{
    if(!dao) return
    getAirdropper({dao}).then(setAirdropper)
  }, [dao])

  useEffect(()=>{
    if(!airdropper) return
    (async()=>{
      const count = await airdropper.distributionsCount()
      setCount(count)
      if(count.isZero()) return
      const latest = await airdropper.distributions(count)
      latest.data = await (await ipfsFetch(latest.dataURI.split(':')[1])).json()
      setLatest(latest)
    })()
  }, [airdropper, dropped])

  useEffect(()=>{
    if(!count || !cred) return
    if(count.isZero()) return setDiff(collateCred({raw: props.cred}))
    else if(latest) return setDiff(collateCred({raw: props.cred, after: latest.data.end}))
  }, [cred, count, latest])

  return (
    <React.Fragment>
      <Heading level={2}>{props.name}</Heading>
      {dao &&
        <Paragraph>
          <Link href={`/dao/#/${dao}`}>
            <a target="_blank"><Button label="use dao" /></a>
          </Link>
        </Paragraph>
      }
      {!dao && <CreateDAO installationId={props.id} onDao={setDao} />}
      {dao && count === undefined && <Loading>retreiving org details</Loading>}
      {count !== undefined && <Paragraph>{`there ${count.toNumber() === 1 ? 'has' : 'have'} been ${count} cred-drop${count.toNumber() === 1 ? '' : 's'}`}</Paragraph>}
      {latest && <Paragraph>{`the most recent cred-drop covers activity till ${new Date(latest.data.end).toDateString()}`}</Paragraph>}
      {!cred && <Paragraph>cred has not been collected yet</Paragraph>}
      {diff &&
        <React.Fragment>
          <Notification icon={<Deploy />} status='ok' message='New cred is available' />
          <Paragraph>
            {!dropped && <Button icon={<Deploy />} label="airdrop cred" onClick={()=>airdrop({jwt: user.jwt, diff, userId: user.id, installationId: props.id}, setDropped)} />}
          </Paragraph>
          <Paragraph>
            <Button label={showCred ? 'hide cred' : 'show cred'} onClick={()=>setShowCred(!showCred)} />
          </Paragraph>
          {showCred && <CredDiff {...diff} />}
        </React.Fragment>
      }
    </React.Fragment>
  )
}

export default InstallationDetail

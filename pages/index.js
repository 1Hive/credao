import React, { useState, useEffect, useContext } from 'react'
import Link from 'next/link'
import { Anchor, Box, Button, Grid, Heading, Paragraph, Text } from 'grommet'
import { Card } from 'grommet-controls'
import { SettingsOption } from 'grommet-icons';
import Loading from '../components/Loading'
import Layout from '../components/Layout'
import UserContext from '../components/UserContext';
import InstallationCard from '../components/InstallationCard';
import { collateCred } from '../utils'
import { create as createDAO, getAirdropper, airdrop } from '../utils/dao'
import { getUserInstallationsByUserId } from '../utils/query'
import ipfsClient from 'ipfs-http-client'

const Index = (props) => {
  const { user } = useContext(UserContext)
  const [installations, setInstallations] = useState()

  useEffect(()=>{
    if(!user) return
    (async ()=>{
      setInstallations( await getUserInstallationsByUserId({jwt: user.jwt, id: user.id}) )
    })()
  }, [user])

  return (
    <Layout>
      <Paragraph>{user ? `Welcome, ${user.username}` : `please login`}</Paragraph>
      {installations && installations.length ?
        <React.Fragment>
          <Heading level={3}>Your organizations:</Heading>
          <Grid columns={{ count: 'fill', size: ['small', 'medium'] }} rows="small" gap={{ row: 'medium' }}>
            {installations.map(i=><InstallationCard key={i.id} {...i} />)}
          </Grid>
          <Box direction='row' justify="center">
          </Box>
        </React.Fragment>
        : null
      }
    </Layout>
  )
}

export default Index

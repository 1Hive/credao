import React, { useState, useEffect, useContext } from 'react'
import Link from 'next/link'
import { Anchor, Box, Button, Heading, Paragraph, Text } from 'grommet'
import { Card } from 'grommet-controls'
import { Deploy, Group, SettingsOption } from 'grommet-icons';
import UserContext from './UserContext';
import CreateDAO from './CreateDAO';
import { create as createDAO, getAirdropper, airdrop }  from '../utils/dao'

function InstallationCard(props) {

  return (
    <Card key={props.id} border={{size: "small"}} background="light-3">
      <Link href='/org/[name]' as={`/org/${props.name}`}>
        <Card.CardTitle background="accent-1" align="center" justify="between" style={{padding: "1em", cursor: "pointer"}}>
          <Heading color="brand" level={4} style={{margin: 0}}>{props.name}</Heading>
          <Link href='/org/[name]' as={`/org/${props.name}`}>
            <SettingsOption color="neutral-3" />
          </Link>
        </Card.CardTitle>
      </Link>
      <Card.CardContent align='center'>
      </Card.CardContent>
      <Card.CardActions align='end' justify="center">
        {props.dao ?
          <Link href={`/dao/#/${props.dao}`}>
            <a target="_blank"><Button icon={<Group />} label="use dao" /></a>
          </Link> :
          <CreateDAO installationId={props.id} />
        }
      </Card.CardActions>
    </Card>
  )
}

export default InstallationCard

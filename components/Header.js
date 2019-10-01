import React, { useState, useEffect, useContext } from 'react'
import Link from 'next/link'
import { Box, Button, Heading, Text } from 'grommet'
import { Grow } from 'grommet-icons';
import UserContext from './UserContext'

const LogIn = props => {
  return (
    <Link href='/sign-in'>
      <Button label="Sign in" />
    </Link>
  )
}

const LogOut = props => {
  return (
    <Box direction='row' align='center' >
      <Text style={{marginRight: "1em"}}>{props.username}</Text>
      <Link href='/sign-out'>
        <Button label="sign out" />
      </Link>
    </Box>
  )
}

const linkStyle = {
  marginRight: 15
};

const AppBar = (props) => (
  <Box
    tag='header'
    direction='row'
    align='center'
    justify='between'
    background='brand'
    pad={{ left: 'medium', right: 'small', vertical: 'small' }}
    elevation='medium'
    style={{ zIndex: '1' }}
    {...props}
  />
);

const Header = props => {
  const { user } = useContext(UserContext)
  return (
    <AppBar>
      <Link href='/'>
        <Heading level='1' size='2em' margin='none' style={{cursor: "pointer"}}><Grow color="status-ok"/>credao</Heading>
      </Link>
      {user ? <LogOut {...user}/> : <LogIn />}
    </AppBar>
  )
}

export default Header;

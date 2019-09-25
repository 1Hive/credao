import React, { useState, useEffect, useContext } from 'react'
import Link from 'next/link'
import UserContext from './UserContext';

const LogIn = props => {
  return (
    <Link href='/sign-in'>
      <a>sign in</a>
    </Link>
  )
}

const LogOut = props => {
  return (
    <React.Fragment>
      <span style={{marginRight: "0.25em"}}>{props.username}</span>
      <Link href='/sign-out'>
        <a>sign out</a>
      </Link>
    </React.Fragment>
  )
}

const linkStyle = {
  marginRight: 15
};

const Header = props => {
  const { user } = useContext(UserContext)
  return (
    <React.Fragment>
      <Link href='/'>
        <a style={{marginRight: "0.25em"}}>home</a>
      </Link>
      <Link href='/test'>
        <a style={{marginRight: "0.25em"}}>test</a>
      </Link>
      {user ? <LogOut {...user}/> : <LogIn />}
    </React.Fragment>
  )
}

export default Header;

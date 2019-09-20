import Link from 'next/link'
import React from 'react'

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
  return (
    <React.Fragment>
      <Link href='/'>
        <a>home</a>
      </Link>
      {props.user ? <LogOut {...props.user}/> : <LogIn />}
    </React.Fragment>
  )
}

export default Header;

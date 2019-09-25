import Link from 'next/link'

export default props =>
  <Link href={`/dao/#/${props.dao}`}>
    <a target="_blank">{props.children}</a>
  </Link>

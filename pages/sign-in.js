import { configureSignIn } from 'next-github-auth'
const SignIn = configureSignIn({ scope: 'read:org' })
export default SignIn

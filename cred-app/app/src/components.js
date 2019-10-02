import styled from 'styled-components'
import {
  breakpoint
} from '@aragon/ui'

export const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
`

export const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  grid-auto-rows: 270px;
  grid-gap: 30px;

  ${breakpoint(
    'medium',
    `
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
     `,
  )};
`

export const Card = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px 30px;
  background: #ffffff;
  border: 1px solid rgba(209, 209, 209, 0.5);
  border-radius: 3px;
`

export const Content = styled.div`
  height: 100%;
`

export const Label = styled.h1`
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 25px;
  height: 50px;
  margin-bottom: 10px;
`

export const Footer = styled.div`
  display: flex;
  justify-content: space-around;
  flex-shrink: 0;
`

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  flex-shrink: 0;
`

import React, { useState, useEffect, useContext } from 'react'
import { Paragraph, Table, TableHeader, TableRow, TableCell, TableBody } from 'grommet'

export default (props) => {
  return (
    <React.Fragment>
      <Table>
        <TableBody>
          <TableRow>
            <TableCell scope="row"><strong>start</strong></TableCell>
            <TableCell>{new Date(props.start).toDateString()}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell scope="row"><strong>end</strong></TableCell>
            <TableCell>{new Date(props.end).toDateString()}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell scope="col" border="bottom"><strong>contributor</strong></TableCell>
            <TableCell scope="col" border="bottom"><strong>cred</strong></TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {props.cred.map((c,idx)=>(
            <TableRow key={idx}>
              <TableCell scope="row">{c.username}</TableCell>
              <TableCell>{c.points}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </React.Fragment>
  )
}

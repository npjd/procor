import { useBoolean } from '@chakra-ui/react'
import React, { useCallback, useState } from 'react'

// props will be signer, contract object, and identity commitment
export default function ListSessions() {
    const [_loading, setLoading] = useBoolean()
    const [_events, setEvents] = useState<any[]>([])
    const [_identityCommitment, setIdentityCommitment] = useState<string>()

    // get current sessions
    const getSessions = useCallback(async () => {
    }, []) 

    // join session
    const joinSession = useCallback(async () => {
    }, [])

    // create session
    const createSession = useCallback(async () => {
    }, [])
    
  return (
    <div>ListSessions</div>
  )
}

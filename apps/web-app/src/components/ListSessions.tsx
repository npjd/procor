import { useBoolean } from "@chakra-ui/react"
import { Identity } from "@semaphore-protocol/identity"
import { Signer, Contract } from "ethers"
import React, { useCallback, useState } from "react"
export type ListSessionProps = {
    signer?: Signer
    contract?: Contract
    identity: Identity
}
// props will be signer, contract object, and identity commitment
export default function ListSessions() {
    const [_loading, setLoading] = useBoolean()
    const [_events, setEvents] = useState<any[]>([])
    const [_identityCommitment, setIdentityCommitment] = useState<string>()

    // get current sessions
    const getSessions = useCallback(async () => {}, [])

    // join session
    const joinSession = useCallback(async () => {}, [])

    // create session
    const createSession = useCallback(async () => {}, [])

    return <div>ListSessions</div>
}

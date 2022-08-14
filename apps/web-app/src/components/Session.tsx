import { useBoolean } from "@chakra-ui/react"
import { Identity } from "@semaphore-protocol/identity"
import { Signer, Contract } from "ethers"
import React, { useCallback, useState } from "react"

export type SessionProps = {
    signer?: Signer
    contract?: Contract
    identity: Identity
    session: any
}

export default function Session() {
  const [_loading, setLoading] = useBoolean()
  const [questions, setQuestions] = useState<any[]>([])

  // const getQuestions = useCallback(async () => {
  // }, [signer,contract,session])

  // const postQuestion = useCallback(async () => {
  // }, [signer,contract,sssion])

  // useEffect(() => {
  //   getQuestions().then(setQuestions)
  // }, [signer,contract,session])

    return <div>Session</div>
}

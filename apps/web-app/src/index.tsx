import { ChakraProvider, Container, HStack, List, Spinner, Stack, Text } from "@chakra-ui/react"
import "@fontsource/inter/400.css"
import detectEthereumProvider from "@metamask/detect-provider"
import { Identity } from "@semaphore-protocol/identity"
import { Contract, providers, Signer } from "ethers"
import { hexlify } from "ethers/lib/utils"
import { useEffect, useState } from "react"
import { createRoot } from "react-dom/client"
import Procor from "../../contracts/build/contracts/contracts/Procor.sol/Procor.json"
import theme from "../styles"
import ListSessions from "./components/ListSessions"
import IdentityStep from "./components/IdentityStep"
import Session from "./components/Session"
import { Session as SessionType } from "./types/Session"

function App() {
    const [_step, setStep] = useState<"identity" | "session" | "sessions">("identity")
    const [_identity, setIdentity] = useState<Identity>()
    const [_signer, setSigner] = useState<Signer>()
    const [_contract, setContract] = useState<Contract>()
    const [_session, setSession] = useState<SessionType>()

    // TODO: change contract
    useEffect(() => {
        ;(async () => {
            const ethereum = (await detectEthereumProvider()) as any
            const accounts = await ethereum.request({ method: "eth_requestAccounts" })

            await ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [
                    {
                        chainId: hexlify(Number(process.env.ETHEREUM_CHAIN_ID!)).replace("0x0", "0x")
                    }
                ]
            })

            const ethersProvider = new providers.Web3Provider(ethereum)

            if (accounts[0]) {
                setSigner(ethersProvider.getSigner())

                setContract(new Contract(process.env.CONTRACT_ADDRESS!, Procor.abi, ethersProvider.getSigner()))
            }

            ethereum.on("accountsChanged", (newAccounts: string[]) => {
                if (newAccounts.length !== 0) {
                    setSigner(ethersProvider.getSigner())

                    setContract(new Contract(process.env.CONTRACT_ADDRESS!, Procor.abi, ethersProvider.getSigner()))
                } else {
                    setSigner(undefined)
                }
            })
        })()
    }, [])

    return (
        <>
            <Container maxW="lg" flex="1" display="flex" alignItems="center">
                <Stack>
                    {_step === "identity" ? (
                        <IdentityStep onChange={setIdentity} onNextClick={() => setStep("sessions")} />
                    ) : 
                    
                    // _step === "sessions" ?
                    
                    (
                        <ListSessions
                            signer={_signer}
                            contract={_contract}
                            identity={_identity as Identity}
                            onPrevClick={() => setStep("identity")}
                            onSelect={(event) => {
                                setSession(event)
                                setStep("session")
                            }}
                        />
                    ) 
                    
                    // : (
                    //     <Session
                    //         signer={_signer}
                    //         contract={_contract}
                    //         identity={_identity as Identity}
                    //         event={_session}
                    //         onPrevClick={() => setStep("sessions")}
                    //     />
                    // )
                    }
                </Stack>
            </Container>
        </>
    )
}

const root = createRoot(document.getElementById("app")!)

root.render(
    <ChakraProvider theme={theme}>
        <App />
    </ChakraProvider>
)

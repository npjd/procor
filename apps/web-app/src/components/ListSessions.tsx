import { Box, Button, Divider, Heading, HStack, Link, Text, useBoolean, VStack } from "@chakra-ui/react"
import { Identity } from "@semaphore-protocol/identity"
import { Contract, Signer } from "ethers"
import { formatBytes32String, parseBytes32String } from "ethers/lib/utils"
import { useCallback, useEffect, useState } from "react"
import IconCheck from "../icons/IconCheck"
import IconAddCircleFill from "../icons/IconAddCircleFill"
import IconRefreshLine from "../icons/IconRefreshLine"
import Stepper from "./Stepper"
import { Session } from "src/types/Session"

export type GroupStepProps = {
    signer?: Signer
    contract?: Contract
    identity: Identity
    onPrevClick: () => void
    onSelect: (session: Session) => void
}

export default function ListSessions({ signer, contract, identity, onPrevClick, onSelect }: GroupStepProps) {
    const [_loading, setLoading] = useBoolean()
    const [_sessions, setSessions] = useState<Session[]>([])
    const [_identityCommitment, setIdentityCommitment] = useState<string>()
    const [_address, setAddress] = useState<string>()

    const getSessions = useCallback(async () => {
        if (!signer || !contract) {
            return []
        }

        const sessions = (await contract.viewSessions()) as Session[]
        console.log("sessions from contract", sessions)
        const sessionsWithIndentities = await Promise.all(
            sessions.map(async (session) => {
                // TODO: check if these numbers work
                const identityCommitments = await contract.viewSessionIdentitiyCommitments(session.sessionId)
                console.log("identityCommitments", identityCommitments)
                return {
                    ...session,
                    members: identityCommitments
                }
            })
        )

        return sessionsWithIndentities
    }, [signer, contract])

    useEffect(() => {
        ;(async () => {
            // TODO: does this even work wtf lol, fetch data properly
            const sessions = (await getSessions()) as unknown as Session[]

            if (sessions.length > 0) {
                setSessions(sessions)
                console.log("Sessions Exist!")

                // onLog(
                //     `${events.length} event${
                //         events.length > 1 ? "s" : ""
                //     } were retrieved from the contract 🤙🏽 Join one or create a new one!`
                // )
            }

            const address = await signer?.getAddress()
            setAddress(address)
        })()
    }, [signer, contract])

    useEffect(() => {
        setIdentityCommitment(identity.generateCommitment().toString())
    }, [identity])

    const createSession = useCallback(async () => {
        if (signer && contract) {
            const sessionName = window.prompt("Please enter your event name:")

            if (sessionName) {
                setLoading.on()
                // onLog(`Creating the '${eventName}' event...`)

                try {
                    const transaction = await contract.createSession(_sessions.length, sessionName)

                    await transaction.wait()

                    setSessions(await getSessions())
                    console.log("session made !!")
                    // onLog(`The '${eventName}' event was just created 🎉`)
                } catch (error) {
                    console.error(error)

                    // onLog("Some error occurred, please try again!")
                } finally {
                    setLoading.off()
                }
            }
        }
    }, [signer, contract])

    const joinSession = useCallback(
        async (session: Session) => {
            if (_identityCommitment) {
                const response = window.confirm(
                    `There are ${session.members.length} members in this event. Are you sure you want to join?`
                )

                if (response) {
                    setLoading.on()
                    // onLog(`Joining the '${event.eventName}' event...`)

                    const { status } = await fetch(`${process.env.RELAY_URL}/join-session`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            sessionId: session.sessionId,
                            identityCommitment: _identityCommitment
                        })
                    })

                    if (status === 200) {
                        const newSession = session;
                        newSession.members = [...session.members, _identityCommitment]
                        onSelect(newSession)

                        // onLog(`You joined the '${event.eventName}' event 🎉 Post your anonymous reviews!`)
                    } else {
                        // onLog("Some error occurred, please try again!")
                    }

                    setLoading.off()
                }
            }
        },
        [_identityCommitment]
    )

    const selectSession = useCallback((_session: Session) => {
        onSelect(_session)

        // onLog(`Post your anonymous reviews in the '${event.eventName}' event 👍🏽`)
    }, [])

    const startSession = useCallback(
        async (_session: Session) => {
            if (!signer || !contract) {
                return
            }

            const address = await signer.getAddress()

            if (address == _session.owner) {
                setLoading.on()
                try {
                    const transaction = await contract.startSession(_session.sessionId)
                    await transaction.wait()
                    console.log("session started !!")
                    setSessions(await getSessions())
                } catch (error) {
                    console.error(error)
                } finally {
                    setLoading.off()
                }
            }
        },
        [signer, contract]
    )

    return (
        <>
            <Heading as="h2" size="xl">
                Groups
            </Heading>

            <Text pt="2" fontSize="md">
                Semaphore{" "}
                <Link href="https://semaphore.appliedzkp.org/docs/guides/groups" color="primary.500" isExternal>
                    groups
                </Link>{" "}
                are binary incremental Merkle trees in which each leaf contains an identity commitment for a user.
                Groups can be abstracted to represent events, polls, or organizations.
            </Text>

            <Divider pt="5" borderColor="gray.500" />

            <HStack pt="5" justify="space-between">
                <Text fontWeight="bold" fontSize="lg">
                    Groups
                </Text>
                <Button
                    leftIcon={<IconRefreshLine />}
                    variant="link"
                    color="text.700"
                    onClick={() => getSessions().then(getSessions)}
                >
                    Refresh
                </Button>
            </HStack>

            <Box py="5">
                <Button
                    w="100%"
                    fontWeight="bold"
                    justifyContent="left"
                    colorScheme="primary"
                    px="4"
                    onClick={createSession}
                    isDisabled={_loading}
                    leftIcon={<IconAddCircleFill />}
                >
                    Create new group
                </Button>
            </Box>

            {_sessions.length > 0 && (
                <VStack spacing="3">
                    {_sessions.map((_session, i) => (
                        <HStack
                            key={i}
                            justify="space-between"
                            w="100%"
                            p="3"
                            backgroundColor="#F8F9FF"
                            borderWidth={1}
                        >
                            <Text>
                                <b>{_session.eventName}</b> ({_session.members.length}{" "}
                                {_session.members.length === 1 ? "member" : "members"}){/* TODO: add owner */}
                            </Text>

                            {_session.members.includes(_identityCommitment || "") ? (
                                <Button
                                    onClick={() => selectSession(_session)}
                                    isDisabled={_loading}
                                    leftIcon={<IconCheck />}
                                    colorScheme="primary"
                                    fontWeight="bold"
                                    variant="link"
                                >
                                    Joined
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => joinSession(_session)}
                                    isDisabled={_loading}
                                    colorScheme="primary"
                                    fontWeight="bold"
                                    variant="link"
                                >
                                    Join
                                </Button>
                            )}

                            {_session.owner === _address && _session.state == 1 && (
                                <Button
                                    onClick={() => startSession(_session)}
                                    isDisabled={_loading}
                                    colorScheme="primary"
                                    fontWeight="bold"
                                    variant="link"
                                >
                                    Start
                                </Button>
                            )}
                        </HStack>
                    ))}
                </VStack>
            )}

            <Divider pt="8" borderColor="gray" />

            <Stepper step={"sessions"} onPrevClick={onPrevClick} />
        </>
    )
}

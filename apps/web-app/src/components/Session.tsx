import { Box, Button, Divider, Heading, HStack, Link, Text, useBoolean, VStack } from "@chakra-ui/react"
import { Group } from "@semaphore-protocol/group"
import { Identity } from "@semaphore-protocol/identity"
import { generateProof, packToSolidityProof } from "@semaphore-protocol/proof"
import { BigNumber, Contract, Signer } from "ethers"
import { parseBytes32String } from "ethers/lib/utils"
import { useCallback, useEffect, useState } from "react"
import { Question, Session as SessionType } from "src/types/Session"
import { TwitterIcon, TwitterShareButton } from "react-share"
import IconAddCircleFill from "../icons/IconAddCircleFill"
import IconRefreshLine from "../icons/IconRefreshLine"
import Stepper from "./Stepper"

export type ProofStepProps = {
    signer?: Signer
    contract?: Contract
    identity: Identity
    session: SessionType
    onPrevClick: () => void
}

export default function Session({ signer, contract, session, identity, onPrevClick }: ProofStepProps) {
    const [_loading, setLoading] = useBoolean()
    const [_questions, setQuestions] = useState<Question[]>([])
    const [_accountAddress, setAccountAddress] = useState<string>("")

    useEffect(() => {
        const getAccountAddress = async () => {
            const address = await signer!.getAddress()
            setAccountAddress(address)
        }
        getAccountAddress()
    }, [])

    const getQuestions = useCallback(async () => {
        if (!signer || !contract) {
            return []
        }
        return session.questions
    }, [signer, contract, session])

    useEffect(() => {
        getQuestions().then(setQuestions)
    }, [signer, contract, session])

    const postQuestion = useCallback(async () => {
        if (contract && identity) {
            const question = prompt("Please enter your question:")

            if (question) {
                setLoading.on()
                // onLog(`Posting your anonymous review...`)

                try {
                    const members = session.members
                    const group = new Group()
                    console.log(members)

                    // TODO: make sure tthis works (it should add all identity commitments)
                    group.addMembers(members)

                    const { proof, publicSignals } = await generateProof(
                        identity,
                        group,
                        session.sessionId.toString(),
                        question
                    )

                    const solidityProof = packToSolidityProof(proof)
                    // TODO: make sure merkle root stuff works
                    const { status } = await fetch(`${process.env.RELAY_URL}/ask-question`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            sessionId: session.sessionId,
                            question,
                            nullifierHash: publicSignals.nullifierHash,
                            solidityProof,
                            root: group.root.toString()
                        })
                    })

                    if (status === 200) {
                        // TODO: chnage the question Id Part
                        const newQuestionObj: Question = {
                            content: question,
                            questionId: BigNumber.from(_questions.length.toString()),
                            votes: BigNumber.from("0")
                        }
                        setQuestions((v) => [...v, newQuestionObj])

                        // onLog(`Your review was posted 🎉`)
                    } else {
                        // onLog("Some error occurred, please try again!")
                    }
                } catch (error) {
                    console.error(error)

                    // onLog("Some error occurred, please try again!")
                } finally {
                    setLoading.off()
                }
            }
        }
    }, [contract, identity])

    // TODO: add function for voting questions
    const voteQuestion = useCallback(
        async (questionId: number) => {
            if (contract && identity) {
                setLoading.on()
                // onLog(`Posting your anonymous review...`)

                try {
                    const signal = session.sessionId * 1000 + questionId
                    const members = session.members
                    const group = new Group()
                    console.log(members)

                    // TODO: make sure tthis works (it should add all identity commitments)
                    group.addMembers(members)

                    const { proof, publicSignals } = await generateProof(
                        identity,
                        group,
                        session.sessionId.toString(),
                        signal.toString()
                    )

                    const solidityProof = packToSolidityProof(proof)
                    // TODO: make sure merkle root stuff works
                    const { status } = await fetch(`${process.env.RELAY_URL}/vote-question`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            sessionId: session.sessionId,
                            signal: signal.toString(),
                            nullifierHash: publicSignals.nullifierHash,
                            solidityProof,
                            root: group.root.toString(),
                            questionId: questionId
                        })
                    })

                    if (status === 200) {
                        const newQuestionArray = _questions.map((question) => {
                            console.log(question.questionId.toNumber())
                            if (question.questionId.toNumber() === questionId) {
                                return {
                                    ...question,
                                    votes: question.votes.add(1)
                                }
                            }
                            return question
                        })
                        setQuestions(newQuestionArray)

                        // onLog(`Your review was posted 🎉`)
                    } else {
                        // onLog("Some error occurred, please try again!")
                    }
                } catch (error) {
                    console.error(error)

                    // onLog("Some error occurred, please try again!")
                } finally {
                    setLoading.off()
                }
            }
        },
        [contract, identity]
    )

    return (
        <>
            <Heading as="h2" size="xl">
                Messages
            </Heading>

            <Text pt="2" fontSize="md">
                Here you can post messages to the group or vote on existing messages.
            </Text>

            <Divider pt="5" borderColor="gray.500" />

            <HStack pt="5" justify="space-between">
                <Text fontWeight="bold" fontSize="lg">
                    <b>{session.eventName}</b> ({session.members.length})
                </Text>
                <Button
                    leftIcon={<IconRefreshLine />}
                    variant="link"
                    color="text.700"
                    onClick={() => getQuestions().then(setQuestions)}
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
                    onClick={postQuestion}
                    isDisabled={_loading}
                    leftIcon={<IconAddCircleFill />}
                >
                    Create a question
                </Button>
            </Box>

            {_questions.length > 0 && (
                <VStack spacing="3" align="left">
                    {_questions.map((_question, i) => (
                        <HStack key={i} p="3" borderWidth={1}>
                            <Text>{parseBytes32String(_question.content)}</Text>
                            <Text>
                                <b>Votes:</b>
                                {_question.votes.toString()}
                            </Text>
                            <Button
                                w="100%"
                                fontWeight="bold"
                                justifyContent="right"
                                colorScheme="primary"
                                px="4"
                                onClick={() => {
                                    voteQuestion(_question.questionId.toNumber())
                                }}
                                isDisabled={_loading}
                                leftIcon={<IconAddCircleFill />}
                            >
                                Vote Question{" "}
                            </Button>
                            {_accountAddress === session.owner && (
                                <TwitterShareButton title={session.eventName +": "} url="">
                                    <TwitterIcon size={32} round /> 
                                </TwitterShareButton>
                            )}
                        </HStack>
                    ))}
                </VStack>
            )}

            <Divider pt="4" borderColor="gray" />

            <Stepper step={"session"} onPrevClick={onPrevClick} />
        </>
    )
}

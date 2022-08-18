import { Box, Button, Divider, Heading, HStack, Link, Text, useBoolean, VStack } from "@chakra-ui/react"
import { Group } from "@semaphore-protocol/group"
import { Identity } from "@semaphore-protocol/identity"
import { generateProof, packToSolidityProof } from "@semaphore-protocol/proof"
import { Contract, Signer } from "ethers"
import { parseBytes32String } from "ethers/lib/utils"
import { useCallback, useEffect, useState } from "react"
import { Question, Session } from "src/types/Session"
import IconAddCircleFill from "../icons/IconAddCircleFill"
import IconRefreshLine from "../icons/IconRefreshLine"
import Stepper from "./Stepper"

export type ProofStepProps = {
    signer?: Signer
    contract?: Contract
    identity: Identity
    session: Session
    onPrevClick: () => void
}

export default function Session({ signer, contract, session, identity, onPrevClick }: ProofStepProps) {
    const [_loading, setLoading] = useBoolean()
    const [_questions, setQuestions] = useState<Question[]>([])

    const getQuestions = useCallback(async () => {
        if (!signer || !contract) {
            return []
        }
        // TODO: fetch question from contract

        return session.questions
    }, [signer, contract, session])

    useEffect(() => {
        getQuestions().then(setQuestions)
    }, [signer, contract, session])

    // TODO: code question posting
    const postQuestion = useCallback(async () => {
        if (contract && identity) {
            const question = prompt("Please enter your review:")

            if (question) {
                setLoading.on()
                // onLog(`Posting your anonymous review...`)

                try {
                    const members = session.members
                    const group = new Group()

                    // TODO: fix this part
                    group.addMembers(members)

                    const { proof, publicSignals } = await generateProof(
                        identity,
                        group,
                        session.sessionId.toString(),
                        question
                    )
                    const solidityProof = packToSolidityProof(proof)

                    const { status } = await fetch(`${process.env.RELAY_URL}/post-review`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            question,
                            nullifierHash: publicSignals.nullifierHash,
                            groupId: session.sessionId.toString(),
                            solidityProof
                        })
                    })

                    if (status === 200) {
                        // TODO: chnage the question Id Part
                        setQuestions((v) => [
                            ...v,
                            {
                                question,
                                questionId: 0,
                                votes: 0
                            }
                        ])

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

    return (
        <>
            <Heading as="h2" size="xl">
                Proofs
            </Heading>

            <Text pt="2" fontSize="md">
                Semaphore group members can anonymously{" "}
                <Link href="https://semaphore.appliedzkp.org/docs/guides/proofs" color="primary.500" isExternal>
                    prove
                </Link>{" "}
                that they are part of a group and that they are generating their own signals. Signals could be anonymous
                votes, leaks, or reviews.
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
                    Generate a signal
                </Button>
            </Box>

            {_questions.length > 0 && (
                <VStack spacing="3" align="left">
                    {_questions.map((_question, i) => (
                        <HStack key={i} p="3" borderWidth={1}>
                            <Text>{parseBytes32String(_question.question)}</Text>
                            <Text>
                                <b>Votes:</b>
                                {_question.votes}
                            </Text>
                        </HStack>
                    ))}
                </VStack>
            )}

            <Divider pt="4" borderColor="gray" />

            <Stepper step={"session"} onPrevClick={onPrevClick} />
        </>
    )
}

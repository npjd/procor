import { BigNumber } from "ethers"

export interface Session {
    sessionId: number
    eventName: string
    owner: string
    state: number
    questions: Question[]
    members: string[]
}

export interface Question {
    questionId: BigNumber
    content: string
    votes: BigNumber
}
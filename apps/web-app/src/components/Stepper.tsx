import { Box, Button, HStack, Text } from "@chakra-ui/react"
import IconChevronLeft from "../icons/IconChevronLeft"
import IconChevronRight from "../icons/IconChevronRight"

export type StepperProps = {
    step: "identity" | "session" | "sessions"
    onPrevClick?: (() => void) | false
    onNextClick?: (() => void) | false
}

export default function Stepper({ step, onPrevClick, onNextClick }: StepperProps) {
    return (
        <HStack width="100%" justify="space-between" pt="6">
            {onPrevClick !== undefined ? (
                <Button
                    flex="1"
                    leftIcon={<IconChevronLeft />}
                    justifyContent="left"
                    colorScheme="primary"
                    variant="link"
                    onClick={onPrevClick || undefined}
                >
                    Prev
                </Button>
            ) : (
                <Box flex="1" />
            )}

            <Text textAlign="center" flex="1" fontWeight="bold">
                {step.toUpperCase()}
            </Text>

            {onNextClick !== undefined ? (
                <Button
                    flex="1"
                    rightIcon={<IconChevronRight />}
                    justifyContent="right"
                    colorScheme="primary"
                    variant="link"
                    isDisabled={!onNextClick}
                    onClick={onNextClick || undefined}
                >
                    Next
                </Button>
            ) : (
                <Box flex="1" />
            )}
        </HStack>
    )
}

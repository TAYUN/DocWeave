import { Stack, Text, Title } from '@mantine/core'

export function SectionHeading({
  eyebrow,
  title,
  description,
  titleOrder = 2,
}: {
  eyebrow: string
  title: string
  description?: string
  titleOrder?: 2 | 3 | 4
}) {
  return (
    <Stack gap={0}>
      <Text className="section-eyebrow">{eyebrow}</Text>
      <Title order={titleOrder} mt="xs">
        {title}
      </Title>
      {description ? (
        <Text className="section-description" mt={4} size="sm">
          {description}
        </Text>
      ) : null}
    </Stack>
  )
}

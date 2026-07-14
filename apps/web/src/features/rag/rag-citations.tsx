import { Accordion, Badge, Group, Stack, Text, Tooltip } from '@mantine/core'
import type { RagCitationViewModel } from './lib'
import { CitationLink } from './citation-link'

export function RagCitations({ citations }: { citations: RagCitationViewModel[] }) {
  if (!citations.length) {
    return (
      <Text size="sm" c="dimmed">
        本次回答没有可跳转的来源。
      </Text>
    )
  }

  return (
    <Accordion variant="contained" radius="sm" chevronPosition="left" keepMounted={false}>
      <Accordion.Item value="citations">
        <Accordion.Control>
          <Group gap="xs" wrap="nowrap">
            <Text fw={600}>参考来源</Text>
            <Badge size="sm" variant="light" color="gray">
              {citations.length}
            </Badge>
          </Group>
        </Accordion.Control>
        <Accordion.Panel>
          <Stack gap="sm">
            {citations.map((citation, index) => (
              <Group key={citation.id} justify="space-between" wrap="nowrap" gap="sm">
                <Group wrap="nowrap" gap="sm" style={{ minWidth: 0 }}>
                  <Text size="xs" c="dimmed" fw={500} style={{ flex: '0 0 14px' }} ta="right">
                    {index + 1}
                  </Text>
                  <Text size="sm" c="dimmed" lineClamp={1}>
                    {citation.quote ?? '该来源未提供可展示摘录。'}
                  </Text>
                </Group>
                <Tooltip label="打开原文">
                  <CitationLink citation={citation} iconOnly />
                </Tooltip>
              </Group>
            ))}
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  )
}

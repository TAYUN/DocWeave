import { ActionIcon, Anchor, Text } from '@mantine/core'
import { useNavigate } from '@tanstack/react-router'
import { ExternalLink } from 'lucide-react'
import type { RagCitationViewModel } from './lib'
import { toCitationLocationSearch } from './citation-navigation'

export function CitationLink({
  citation,
  label,
  withIcon = true,
  iconOnly = false,
}: {
  citation: RagCitationViewModel
  label?: string
  withIcon?: boolean
  iconOnly?: boolean
}) {
  const navigate = useNavigate()
  const openCitation = () =>
    navigate({
      to: '/documents/$documentId',
      params: { documentId: citation.documentId },
      search: toCitationLocationSearch(citation),
    })

  if (iconOnly) {
    return (
      <ActionIcon
        type="button"
        variant="subtle"
        color="blue"
        size="sm"
        aria-label="打开原文"
        onClick={openCitation}
      >
        <ExternalLink size={15} aria-hidden="true" />
      </ActionIcon>
    )
  }

  return (
    <Anchor
      component="button"
      type="button"
      size="sm"
      onClick={openCitation}
    >
      <Text component="span" inherit>
        {label ?? citation.id}
      </Text>{withIcon ? ' ' : null}
      {withIcon ? <ExternalLink size={13} aria-hidden="true" /> : null}
    </Anchor>
  )
}

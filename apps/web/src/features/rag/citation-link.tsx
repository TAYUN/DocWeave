import { Anchor, Text } from '@mantine/core'
import { useNavigate } from '@tanstack/react-router'
import { ExternalLink } from 'lucide-react'
import type { RagCitationViewModel } from './lib'
import { toCitationLocationSearch } from './citation-navigation'

export function CitationLink({ citation, label }: { citation: RagCitationViewModel; label?: string }) {
  const navigate = useNavigate()

  return (
    <Anchor
      component="button"
      type="button"
      size="sm"
      onClick={() =>
        navigate({
          to: '/documents/$documentId',
          params: { documentId: citation.documentId },
          search: toCitationLocationSearch(citation),
        })
      }
    >
      <Text component="span" inherit>
        {label ?? citation.id}
      </Text>{' '}
      <ExternalLink size={13} aria-hidden="true" />
    </Anchor>
  )
}

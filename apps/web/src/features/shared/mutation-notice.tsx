import { Alert } from '@mantine/core'
import { AlertCircle } from 'lucide-react'

export function MutationNotice({ message }: { message: string | null }) {
  if (!message) {
    return null
  }

  return (
    <Alert
      className="notice-inline status-alert status-alert--error"
      color="red"
      icon={<AlertCircle size={18} />}
      variant="light"
    >
      {message}
    </Alert>
  )
}

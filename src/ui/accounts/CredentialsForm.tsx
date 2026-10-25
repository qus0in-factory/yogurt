import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { credentialsSchema, type CredentialsInput } from '../../app/accounts/credentials-client'
import { Button } from '../components/Button'
import { TextField } from '../components/TextField'
import { credentialsText } from '../glossary/credentials'
import { spacing, typeScale } from '../styles/type-scale'
import { useReplaceCredentials } from './useReplaceCredentials'

export function CredentialsForm({ accountId, onBack, onClose }: { accountId: string; onBack: () => void; onClose: () => void }) {
  const replace = useReplaceCredentials(accountId)
  const { control, handleSubmit } = useForm<CredentialsInput>({
    defaultValues: { accessKey: '', secretKey: '' },
    resolver: zodResolver(credentialsSchema),
  })
  const field = (name: keyof CredentialsInput, label: string) => (
    <Controller name={name} control={control} render={({ field: input, fieldState }) => (
      <TextField label={label} name={name} value={input.value} onChange={input.onChange}
        type="password" autoComplete="new-password" error={fieldState.error?.message} />
    )} />
  )
  return (
    <form onSubmit={handleSubmit((input) => replace.mutate(input, {
      onSuccess: () => { onClose(); toast(credentialsText.success) },
      onError: (error) => {
        const status = (error as { response?: { status?: number } }).response?.status
        toast.error(status === 404 ? credentialsText.notFound : status === 503 ? credentialsText.storageNotConfigured : credentialsText.failed)
      },
    }))} className={spacing.stack}>
      <p className={typeScale.body}>{credentialsText.notice}</p>
      {field('accessKey', credentialsText.accessKey)}
      {field('secretKey', credentialsText.secretKey)}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onBack}>{credentialsText.back}</Button>
        <Button type="submit" disabled={replace.isPending}>{credentialsText.submit}</Button>
      </div>
    </form>
  )
}

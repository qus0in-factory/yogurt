import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { accountInputSchema, type AccountInput } from '../../domain/accounts/account'
import { Button } from '../components/Button'
import { Dialog } from '../components/Dialog'
import { TextField } from '../components/TextField'
import { readSessionJson, removeSession, writeSessionJson } from '../lib/session-draft'
import { useCreateAccount } from './useAccounts'
import { accountsText } from '../glossary/accounts'

type AddAccountDialogProps = { open: boolean; onClose: () => void }
type FieldExtra = { type?: 'text' | 'password'; maxLength?: number; inputMode?: 'numeric'; pattern?: string; placeholder?: string }

const DRAFT_KEY = 'yogurt:account-draft'

export function AddAccountDialog({ open, onClose }: AddAccountDialogProps) {
  const createAccount = useCreateAccount()
  const draft = readSessionJson<{ alias: string; owner: string; accountNumber: string }>(DRAFT_KEY)
  const { control, handleSubmit, reset, setError, watch } = useForm<AccountInput>({
    defaultValues: { alias: draft?.alias ?? '', owner: draft?.owner ?? '', accountNumber: draft?.accountNumber ?? '', accessKey: '', secretKey: '' },
    resolver: zodResolver(accountInputSchema),
  })

  useEffect(() => {
    const sub = watch(({ alias, owner, accountNumber }) => {
      if (typeof alias !== 'string' || typeof owner !== 'string' || typeof accountNumber !== 'string') return
      if (alias === '' && owner === '' && accountNumber === '') removeSession(DRAFT_KEY)
      else writeSessionJson(DRAFT_KEY, { alias, owner, accountNumber })
    })
    return () => sub.unsubscribe()
  }, [watch])

  const field = (label: string, name: keyof AccountInput, extra: FieldExtra = {}, sanitize?: (value: string) => string) => (
    <Controller
      name={name}
      control={control}
      render={({ field: f, fieldState }) => (
        <TextField label={label} name={name} value={f.value} onChange={(value) => f.onChange(sanitize?.(value) ?? value)} error={fieldState.error?.message} {...extra} />
      )}
    />
  )

  const onSubmit = (values: AccountInput) => {
    createAccount.mutate(values, {
      onSuccess: () => {
        removeSession(DRAFT_KEY)
        reset({ alias: '', owner: '', accountNumber: '', accessKey: '', secretKey: '' })
        onClose()
        toast(accountsText.added)
      },
      onError: (error) => {
        const status = (error as { response?: { status?: number } }).response?.status
        if (status === 409) {
          setError('accountNumber', { type: 'server', message: accountsText.duplicateAccountNumber })
          return
        }
        toast.error(status === 503 ? accountsText.storageNotConfigured : accountsText.addFailed)
      },
    })
  }

  return (
    <Dialog open={open} onClose={onClose} title={accountsText.addTitle}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {field(accountsText.owner, 'owner', { maxLength: 8 })}
        {field(accountsText.alias, 'alias', { maxLength: 8 })}
        {field(accountsText.accountNumber, 'accountNumber', { maxLength: 8, inputMode: 'numeric', pattern: '[0-9]{8}', placeholder: accountsText.accountNumberExample }, (value) => value.replace(/\D/g, ''))}
        {field(accountsText.accessKey, 'accessKey')}
        {field(accountsText.secretKey, 'secretKey', { type: 'password' })}
        <div className="sticky bottom-0 flex justify-end gap-2 bg-white">
          <Button type="button" variant="ghost" onClick={onClose}>{accountsText.cancel}</Button>
          <Button type="submit" disabled={createAccount.isPending}>{accountsText.save}</Button>
        </div>
      </form>
    </Dialog>
  )
}

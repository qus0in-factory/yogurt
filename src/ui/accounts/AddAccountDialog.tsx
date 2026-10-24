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

type AddAccountDialogProps = { open: boolean; onClose: () => void }

const DRAFT_KEY = 'yogurt:account-draft'

export function AddAccountDialog({ open, onClose }: AddAccountDialogProps) {
  const createAccount = useCreateAccount()
  const draft = readSessionJson<{ alias: string; accountNumber: string }>(DRAFT_KEY)
  const { control, handleSubmit, reset, watch } = useForm<AccountInput>({
    defaultValues: { alias: draft?.alias ?? '', accountNumber: draft?.accountNumber ?? '', accessKey: '', secretKey: '' },
    resolver: zodResolver(accountInputSchema),
  })

  useEffect(() => {
    const sub = watch(({ alias, accountNumber }) => {
      if (typeof alias !== 'string' || typeof accountNumber !== 'string') return
      if (alias === '' && accountNumber === '') removeSession(DRAFT_KEY)
      else writeSessionJson(DRAFT_KEY, { alias, accountNumber })
    })
    return () => sub.unsubscribe()
  }, [watch])

  const field = (label: string, name: keyof AccountInput, type?: 'text' | 'password') => (
    <Controller
      name={name}
      control={control}
      render={({ field: f, fieldState }) => (
        <TextField label={label} name={name} type={type} value={f.value} onChange={f.onChange} error={fieldState.error?.message} />
      )}
    />
  )

  const onSubmit = (values: AccountInput) => {
    createAccount.mutate(values, {
      onSuccess: () => {
        removeSession(DRAFT_KEY)
        reset({ alias: '', accountNumber: '', accessKey: '', secretKey: '' })
        onClose()
        toast('계좌를 추가했습니다')
      },
      onError: (error) => {
        const status = (error as { response?: { status?: number } }).response?.status
        toast.error(status === 503 ? '저장소가 아직 설정되지 않았습니다' : '계좌를 추가하지 못했습니다')
      },
    })
  }

  return (
    <Dialog open={open} onClose={onClose} title="계좌 추가">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {field('별칭', 'alias')}
        {field('계좌번호', 'accountNumber')}
        {field('Access Key', 'accessKey')}
        {field('Secret Key', 'secretKey', 'password')}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>취소</Button>
          <Button type="submit" disabled={createAccount.isPending}>저장</Button>
        </div>
      </form>
    </Dialog>
  )
}

import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { accountUpdateSchema, type Account, type AccountUpdate } from '../../domain/accounts/account'
import { Button } from '../components/Button'
import { Dialog } from '../components/Dialog'
import { TextField } from '../components/TextField'
import { accountsText } from '../glossary/accounts'
import { useUpdateAccount } from './useAccounts'

type EditAccountDialogProps = { account: Account; onClose: () => void }

export function EditAccountDialog({ account, onClose }: EditAccountDialogProps) {
  const updateAccount = useUpdateAccount()
  const { control, handleSubmit } = useForm<AccountUpdate>({
    defaultValues: { alias: account.alias, owner: account.owner },
    resolver: zodResolver(accountUpdateSchema),
  })

  const field = (label: string, name: keyof AccountUpdate) => (
    <Controller
      name={name}
      control={control}
      render={({ field: f, fieldState }) => (
        <TextField label={label} name={name} value={f.value} onChange={f.onChange} error={fieldState.error?.message} />
      )}
    />
  )

  const onSubmit = (values: AccountUpdate) => {
    updateAccount.mutate({ id: account.id, input: values }, {
      onSuccess: () => {
        onClose()
        toast(accountsText.updated)
      },
      onError: (error) => {
        const status = (error as { response?: { status?: number } }).response?.status
        const message = status === 404 ? accountsText.notFound : status === 503 ? accountsText.storageNotConfigured : accountsText.updateFailed
        toast.error(message)
      },
    })
  }

  return (
    <Dialog open onClose={onClose} title={accountsText.editTitle}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {field(accountsText.alias, 'alias')}
        {field(accountsText.owner, 'owner')}
        <p className="text-sm text-stone-600">
          {accountsText.accountNumber}: <span>{account.accountNumber}</span>
        </p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>{accountsText.cancel}</Button>
          <Button type="submit" disabled={updateAccount.isPending}>{accountsText.save}</Button>
        </div>
      </form>
    </Dialog>
  )
}

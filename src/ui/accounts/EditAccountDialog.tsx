import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2 } from 'lucide-react'
import { useId, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { ownerSuggestions } from '../../app/accounts/owner-suggestions'
import { accountUpdateSchema, type Account, type AccountUpdate } from '../../domain/accounts/account'
import { Button } from '../components/Button'
import { Dialog } from '../components/Dialog'
import { TextField } from '../components/TextField'
import { accountsText } from '../glossary/accounts'
import { DeleteAccountDialog } from './DeleteAccountDialog'
import { useAccounts, useUpdateAccount } from './useAccounts'

type EditAccountDialogProps = { account: Account; onClose: () => void }
type FieldExtra = { list?: string; autoComplete?: string; maxLength?: number; inputMode?: 'numeric'; pattern?: string; placeholder?: string }

export function EditAccountDialog({ account, onClose }: EditAccountDialogProps) {
  const updateAccount = useUpdateAccount()
  const ownerListId = useId()
  const { data } = useAccounts()
  const owners = ownerSuggestions(data ?? [])
  const [deleteOpen, setDeleteOpen] = useState(false)
  const { control, handleSubmit } = useForm<AccountUpdate>({
    defaultValues: { alias: account.alias, owner: account.owner },
    resolver: zodResolver(accountUpdateSchema),
  })
  const field = (label: string, name: keyof AccountUpdate, extra: FieldExtra = {}, sanitize?: (value: string) => string) => (
    <Controller
      name={name}
      control={control}
      render={({ field: f, fieldState }) => (
        <TextField label={label} name={name} maxLength={8} value={f.value} onChange={(value) => f.onChange(sanitize?.(value) ?? value)} error={fieldState.error?.message} {...extra} />
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
    <>
      <Dialog open onClose={onClose} title={accountsText.editTitle}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {field(accountsText.owner, 'owner', { list: ownerListId, autoComplete: 'off' })}
          <datalist id={ownerListId}>{owners.map((owner) => <option key={owner} value={owner} />)}</datalist>
          {field(accountsText.alias, 'alias')}
          <p className="text-sm text-stone-600">
            {accountsText.accountNumber}: <span>{account.accountNumber}</span>
          </p>
          <div className="sticky bottom-0 flex items-center justify-between gap-2 bg-white">
            <Button type="button" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => setDeleteOpen(true)}>
              <Trash2 aria-hidden="true" className="h-4 w-4" />
              {accountsText.delete}
            </Button>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>{accountsText.cancel}</Button>
              <Button type="submit" disabled={updateAccount.isPending}>{accountsText.save}</Button>
            </div>
          </div>
        </form>
      </Dialog>
      {deleteOpen ? <DeleteAccountDialog account={account} onClose={() => setDeleteOpen(false)} onDeleted={onClose} /> : null}
    </>
  )
}

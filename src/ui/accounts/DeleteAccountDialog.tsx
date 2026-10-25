import { toast } from 'sonner'
import type { Account } from '../../domain/accounts/account'
import { Button } from '../components/Button'
import { Dialog } from '../components/Dialog'
import { accountsText } from '../glossary/accounts'
import { typeScale } from '../styles/type-scale'
import { useUiStore } from '../state/ui-store'
import { useDeleteAccount } from './useAccounts'

type DeleteAccountDialogProps = { account: Account; onClose: () => void; onDeleted: () => void }

export function DeleteAccountDialog({ account, onClose, onDeleted }: DeleteAccountDialogProps) {
  const deleteAccount = useDeleteAccount()
  const selectAccount = useUiStore((s) => s.selectAccount)

  const finish = () => {
    if (useUiStore.getState().selectedAccountId === account.id) selectAccount(null)
    onClose()
    // close the confirm first so stacked body-scroll locks restore in order
    setTimeout(onDeleted, 0)
  }

  const confirm = () => {
    deleteAccount.mutate(account.id, {
      onSuccess: () => {
        finish()
        toast(accountsText.deleted)
      },
      onError: (error) => {
        const status = (error as { response?: { status?: number } }).response?.status
        if (status === 404) {
          finish()
          toast.error(accountsText.alreadyDeleted)
          return
        }
        toast.error(accountsText.deleteFailed)
      },
    })
  }

  return (
    <Dialog open onClose={onClose} title={accountsText.deleteTitle}>
      <div className="flex flex-col gap-4">
        <p className={typeScale.body}>{accountsText.deleteBody(account.owner, account.alias, account.accountNumber)}</p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>{accountsText.cancel}</Button>
          <Button type="button" className="bg-red-600 text-white hover:bg-red-700" disabled={deleteAccount.isPending} onClick={confirm}>{accountsText.deleteConfirm}</Button>
        </div>
      </div>
    </Dialog>
  )
}

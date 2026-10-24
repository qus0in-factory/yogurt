import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { accountInputSchema, type AccountInput } from '../../domain/account'
import { Button } from '../components/Button'
import { Dialog } from '../components/Dialog'
import { TextField } from '../components/TextField'
import { useCreateAccount } from './useAccounts'

type AddAccountDialogProps = {
  open: boolean
  onClose: () => void
}

export function AddAccountDialog({ open, onClose }: AddAccountDialogProps) {
  const createAccount = useCreateAccount()
  const { control, handleSubmit, reset } = useForm<AccountInput>({
    defaultValues: { alias: '', accountNumber: '', accessKey: '', secretKey: '' },
    resolver: zodResolver(accountInputSchema),
  })

  const onSubmit = (values: AccountInput) => {
    createAccount.mutate(values, {
      onSuccess: () => {
        reset()
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
        <Controller
          name="alias"
          control={control}
          render={({ field, fieldState }) => (
            <TextField label="별칭" name="alias" value={field.value} onChange={field.onChange} error={fieldState.error?.message} />
          )}
        />
        <Controller
          name="accountNumber"
          control={control}
          render={({ field, fieldState }) => (
            <TextField label="계좌번호" name="accountNumber" value={field.value} onChange={field.onChange} error={fieldState.error?.message} />
          )}
        />
        <Controller
          name="accessKey"
          control={control}
          render={({ field, fieldState }) => (
            <TextField label="Access Key" name="accessKey" value={field.value} onChange={field.onChange} error={fieldState.error?.message} />
          )}
        />
        <Controller
          name="secretKey"
          control={control}
          render={({ field, fieldState }) => (
            <TextField label="Secret Key" name="secretKey" type="password" value={field.value} onChange={field.onChange} error={fieldState.error?.message} />
          )}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>취소</Button>
          <Button type="submit" disabled={createAccount.isPending}>저장</Button>
        </div>
      </form>
    </Dialog>
  )
}

import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { loginRequestSchema } from '../../domain/auth/auth-schema'
import { Button } from '../components/Button'
import { TextField } from '../components/TextField'
import { useLogin } from './useSession'
import { authText } from '../glossary/auth'
import { cn } from '../lib/cn'
import { spacing, typeScale } from '../styles/type-scale'

type LoginValues = { password: string }

export function LoginForm({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const loginMutation = useLogin()
  const { control, handleSubmit, setError } = useForm<LoginValues>({
    defaultValues: { password: '' },
    resolver: zodResolver(loginRequestSchema),
  })
  const loading = loginMutation.isPending

  const onSubmit = (values: LoginValues) => {
    loginMutation.mutate(values.password, {
      onSuccess: (ok) => {
        if (ok) {
          onLoginSuccess()
          return
        }
        setError('password', { message: authText.invalidPassword })
        toast.error(authText.invalidPassword)
      },
      onError: () => toast.error(authText.tryAgainLater),
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary-50 p-4">
      <div className={cn('w-full max-w-sm border border-stone-200 bg-white shadow-sm', spacing.card)}>
        <h1 className={typeScale.pageTitle}>{authText.loginTitle}</h1>
        <p className={cn(typeScale.body, 'mt-1')}>{authText.loginDescription}</p>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6">
          <fieldset disabled={loading} className={spacing.stack}>
            <Controller
            name="password"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                label={authText.passwordLabel}
                name="password"
                type="password"
                value={field.value}
                onChange={field.onChange}
                error={
                  fieldState.error
                    ? fieldState.error.type === 'too_small'
                      ? authText.passwordRequired
                      : fieldState.error.message
                    : undefined
                }
              />
            )}
          />
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? authText.loggingIn : authText.loginButton}
            </Button>
          </fieldset>
        </form>
      </div>
    </div>
  )
}

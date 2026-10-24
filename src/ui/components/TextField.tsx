import { useId } from 'react'

type TextFieldProps = {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'password' | 'number' | 'date'
  error?: string
  required?: boolean
}

export function TextField({ label, name, value, onChange, type = 'text', error, required }: TextFieldProps) {
  const inputId = useId()
  const errorId = useId()

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className="rounded-md border border-stone-300 px-3 py-2"
      />
      {error ? (
        <p id={errorId} className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  )
}

type YogurtIconProps = {
  className?: string
}

export function YogurtIcon({ className }: YogurtIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" className={className}>
      <path d="M6 2.5H18Q19 2.5 19 3.4V3.6Q19 4.5 18 4.5H6Q5 4.5 5 3.6V3.4Q5 2.5 6 2.5Z" />
      <path d="M10 4.5H14V6.2C14 7.6 18 8.4 18 11.2C18 12.8 16 12.9 16 14.2C16 15.8 17.6 16.6 17.6 18.2C17.6 20.4 15.2 21.6 12 21.6C8.8 21.6 6.4 20.4 6.4 18.2C6.4 16.6 8 15.8 8 14.2C8 12.9 6 12.8 6 11.2C6 8.4 10 7.6 10 6.2Z" />
    </svg>
  )
}

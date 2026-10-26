export type SubNavItem = {
  key: string
  label: string
}

export function SubNav({
  items,
  currentKey,
  isParentActive,
  onSelect,
}: {
  items: readonly SubNavItem[]
  currentKey?: string
  isParentActive?: boolean
  onSelect: (key: string) => void
}) {
  return (
    <div className="ml-6 flex flex-col gap-0.5 border-l border-stone-200 pl-2">
      {items.map((item) => {
        const isCurrent = Boolean(isParentActive && currentKey === item.key)
        return (
          <button
            key={item.key}
            type="button"
            aria-current={isCurrent ? 'page' : undefined}
            className={`w-full rounded-md px-3 py-1.5 text-left text-xs transition-colors ${
              isCurrent
                ? 'bg-stone-100 font-semibold text-stone-900'
                : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900'
            }`}
            onClick={() => onSelect(item.key)}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

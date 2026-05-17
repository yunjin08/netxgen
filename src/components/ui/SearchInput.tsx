import { Search, X } from 'lucide-react'
import { Input } from './Input'
import { cn } from '@/utils/cn'

interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string
  onChange: (value: string) => void
  onClear?: () => void
  className?: string
  inputClassName?: string
}

export function SearchInput({
  value,
  onChange,
  onClear,
  className,
  inputClassName,
  placeholder = 'Search...',
  ...props
}: SearchInputProps) {
  return (
    <div className={cn('relative flex items-center', className)}>
      <Search className="absolute left-3 h-4 w-4 text-grey-40 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn('input-base pl-9', value && 'pr-9', inputClassName)}
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={() => { onChange(''); onClear?.() }}
          className="absolute right-3 text-grey-40 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

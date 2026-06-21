import { Check, ChevronsRight, FileText, Inbox, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Category, Todo } from '@/lib/types'

export function TodoItem({
  todo,
  categories,
  showDate = true,
  onToggle,
  onText,
  onDate,
  onTomorrow,
  onBacklog,
  onDelete,
  onOpen
}: {
  todo: Todo
  categories: Category[]
  showDate?: boolean
  onToggle: () => void
  onText: (v: string) => void
  onDate: (v: string | null) => void
  onTomorrow: () => void
  onBacklog: () => void
  onDelete: () => void
  onOpen: () => void
}): JSX.Element {
  const cat = categories.find((c) => c.id === todo.categoryId) ?? null
  const hasDetails = !!todo.details && todo.details.trim().length > 0
  const hasTags = !!todo.tags && todo.tags.length > 0

  return (
    <div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            'grid h-5 w-5 flex-shrink-0 place-items-center rounded-md border transition-colors',
            todo.done
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-input hover:border-primary'
          )}
          aria-label={todo.done ? 'Mark not done' : 'Mark done'}
        >
          {todo.done && <Check className="h-3.5 w-3.5" />}
        </button>
        {cat && (
          <span
            className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
            style={{ background: cat.color }}
            title={cat.name}
          />
        )}
        <input
          value={todo.text}
          onChange={(e) => onText(e.target.value)}
          className={cn(
            'min-w-0 flex-1 bg-transparent text-sm outline-none',
            todo.done && 'text-muted-foreground line-through'
          )}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={onOpen}
          title="Details & tags"
        >
          <FileText />
        </Button>
        {showDate && (
          <Input
            type="date"
            value={todo.date ?? ''}
            onChange={(e) => onDate(e.target.value || null)}
            className="h-8 w-[150px] flex-shrink-0"
            title="Reschedule to a specific day"
          />
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={onTomorrow}
          title="Move to next day"
        >
          <ChevronsRight />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={onBacklog}
          title="Send to backlog"
        >
          <Inbox />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
          title="Delete"
        >
          <X />
        </Button>
      </div>
      {(hasDetails || hasTags) && (
        <div className="ml-7 mt-1 flex flex-wrap items-center gap-1.5">
          {hasDetails && (
            <button
              type="button"
              onClick={onOpen}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <FileText className="h-3 w-3" />
              notes
            </button>
          )}
          {todo.tags?.map((t) => (
            <span
              key={t}
              className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground"
            >
              #{t}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

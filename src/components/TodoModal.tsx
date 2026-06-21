import { useState, type KeyboardEvent } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Category, Todo } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select'
import { X } from 'lucide-react'

const NONE = '__none__'

export interface TodoFields {
  text: string
  details: string
  tags: string[]
  date: string | null
  categoryId: string | null
}

export function TodoModal({
  initial,
  categories,
  onClose,
  onSubmit,
  onDelete
}: {
  initial: Partial<Todo>
  categories: Category[]
  onClose: () => void
  onSubmit: (fields: TodoFields) => void
  onDelete?: () => void
}): JSX.Element {
  const [text, setText] = useState(initial.text ?? '')
  const [details, setDetails] = useState(initial.details ?? '')
  const [tags, setTags] = useState<string[]>(initial.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [date, setDate] = useState<string | null>(initial.date ?? null)
  const [categoryId, setCategoryId] = useState<string | null>(initial.categoryId ?? null)
  const [tab, setTab] = useState<'write' | 'preview'>('write')

  function addTag(): void {
    const v = tagInput.trim().replace(/^#+/, '')
    if (v && !tags.includes(v)) setTags([...tags, v])
    setTagInput('')
  }

  function onTagKey(e: KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag()
    } else if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      setTags(tags.slice(0, -1))
    }
  }

  function save(): void {
    if (!text.trim()) return
    onSubmit({ text: text.trim(), details, tags, date, categoryId })
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <Card
        className="flex max-h-[90vh] w-[560px] max-w-full flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>{initial.id ? 'Edit to-do' : 'New to-do'}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 space-y-4 overflow-y-auto">
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Title</span>
            <Input
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What needs doing?"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Activity</span>
              <Select
                value={categoryId ?? NONE}
                onValueChange={(v) => setCategoryId(v === NONE ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>No activity</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Date</span>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={date ?? ''}
                  onChange={(e) => setDate(e.target.value || null)}
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="sm" onClick={() => setDate(null)}>
                  Backlog
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Tags</span>
            <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-input p-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter((x) => x !== t))}
                    className="opacity-70 hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={onTagKey}
                onBlur={addTag}
                placeholder={tags.length ? '' : 'Add tag, press Enter'}
                className="min-w-[120px] flex-1 bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Details (Markdown)</span>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant={tab === 'write' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setTab('write')}
                >
                  Write
                </Button>
                <Button
                  type="button"
                  variant={tab === 'preview' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setTab('preview')}
                >
                  Preview
                </Button>
              </div>
            </div>
            {tab === 'write' ? (
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={8}
                placeholder={'Write details in Markdown…\n\n- [ ] subtask\n**bold**, _italic_, `code`'}
                className="w-full rounded-md border border-input bg-background p-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            ) : (
              <div className="markdown-body min-h-[188px] rounded-md border border-input bg-muted/30 p-3">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {details.trim() || '_Nothing to preview._'}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </CardContent>

        <div className="flex items-center justify-between gap-2 border-t p-4">
          {onDelete ? (
            <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={onDelete}>
              Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={save} disabled={!text.trim()}>
              Save
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

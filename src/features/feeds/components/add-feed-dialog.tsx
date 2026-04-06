'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { X, Plus, Loader2 } from 'lucide-react'

const AddFeedSchema = z.object({
  rssUrl: z.string().url('Please enter a valid URL'),
})
type AddFeedForm = z.infer<typeof AddFeedSchema>

interface AddFeedDialogProps {
  open: boolean
  onClose: () => void
  onAdded: () => void
}

export function AddFeedDialog({ open, onClose, onAdded }: AddFeedDialogProps) {
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddFeedForm>({ resolver: zodResolver(AddFeedSchema) })

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      reset()
    }
  }, [open, reset])

  const onSubmit = async (data: AddFeedForm) => {
    setLoading(true)
    try {
      const res = await fetch('/api/feeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rssUrl: data.rssUrl }),
      })
      const json = await res.json()

      if (!res.ok) {
        toast.error(json.error || 'Failed to add feed')
        return
      }

      toast.success(`Added "${json.feed.title}"`)
      reset()
      onAdded()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-card-foreground">Add RSS Feed</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              RSS Feed URL
            </label>
            <input
              {...register('rssUrl')}
              ref={(e) => {
                register('rssUrl').ref(e)
                ;(inputRef as React.MutableRefObject<HTMLInputElement | null>).current = e
              }}
              type="url"
              placeholder="https://example.com/feed.xml"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            />
            {errors.rssUrl && (
              <p className="mt-1 text-xs text-destructive">{errors.rssUrl.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 rounded-lg border border-border text-foreground hover:bg-accent transition-colors font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 px-4 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Adding…
                </>
              ) : (
                <>
                  <Plus size={14} />
                  Add Feed
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

import { useEffect, useState, type FormEvent } from 'react'
import { hasPasscode, setPasscode, verifyPasscode } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export function LockScreen({ onUnlock }: { onUnlock: () => void }): JSX.Element {
  const [isSet, setIsSet] = useState<boolean | null>(null)
  const [passcode, setPasscodeVal] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setIsSet(hasPasscode())
  }, [])

  if (isSet === null) {
    return <div className="grid h-screen place-items-center text-muted-foreground">…</div>
  }

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault()
    setError('')
    if (isSet) {
      if (await verifyPasscode(passcode)) {
        onUnlock()
      } else {
        setError('Incorrect passcode')
        setPasscodeVal('')
      }
      return
    }
    if (passcode.length < 4) {
      setError('Use at least 4 characters')
      return
    }
    if (passcode !== confirm) {
      setError('Passcodes do not match')
      return
    }
    await setPasscode(passcode)
    onUnlock()
  }

  return (
    <div className="grid h-screen place-items-center bg-gradient-to-b from-berkeley-blue to-[#001a33] p-4">
      <Card className="w-[360px] p-8 text-center">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-berkeley-gold text-2xl font-bold text-berkeley-blue">
          H
        </div>
        <h1 className="text-xl font-semibold tracking-tight">Tiny Habits Tracker</h1>
        <p className="mb-5 mt-1 text-sm text-muted-foreground">
          {isSet ? 'Enter your passcode to continue' : 'Create a passcode to get started'}
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            type="password"
            autoFocus
            placeholder="Passcode"
            value={passcode}
            onChange={(e) => setPasscodeVal(e.target.value)}
          />
          {!isSet && (
            <Input
              type="password"
              placeholder="Confirm passcode"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full">
            {isSet ? 'Unlock' : 'Set passcode'}
          </Button>
        </form>
      </Card>
    </div>
  )
}

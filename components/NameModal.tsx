import { useState } from 'react'
import { Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

interface NameModalProps {
  open: boolean
  moves: number
  onSubmit: (firstName: string, lastName: string) => Promise<void> | void
  onClose: () => void
}

export function NameModal({ open, moves, onSubmit, onClose }: NameModalProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!firstName || !lastName || isSubmitting) return

    try {
      setIsSubmitting(true)
      await onSubmit(firstName.trim(), lastName.trim())
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <div className="text-center">
          <Trophy className="w-14 h-14 text-yellow-500 mx-auto mb-2" />
          <h2 className="text-xl font-bold text-green-600">¡Felicitaciones! 🎉</h2>
          <p className="text-gray-600 text-sm mt-1">Completaste el juego en {moves} movimientos!</p>
        </div>
        <DialogHeader>
          <DialogTitle>Ingresá tu nombre</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <input
            className="w-full p-2 border rounded"
            placeholder="Nombre"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={isSubmitting}
          />
          <input
            className="w-full p-2 border rounded"
            placeholder="Apellido"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        <DialogFooter className="space-x-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!firstName || !lastName || isSubmitting}
          >
            {isSubmitting ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

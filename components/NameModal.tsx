import { Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '@/components/ui/dialog'

interface NameModalProps {
  open: boolean
  moves: number
  onClose: () => void
}

export function NameModal({ open, moves, onClose }: NameModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent>
        <div className="text-center">
          <Trophy className="w-14 h-14 text-yellow-500 mx-auto mb-2" />
          <DialogTitle className="text-xl font-bold text-green-600">¡Felicitaciones! 🎉</DialogTitle>
          <p className="text-gray-600 text-sm mt-1">Completaste el juego en {moves} movimientos!</p>
        </div>
        <DialogFooter>
          <Button onClick={onClose} className="w-full">
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

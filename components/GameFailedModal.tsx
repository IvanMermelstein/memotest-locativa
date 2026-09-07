import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { RotateCcw } from 'lucide-react'

interface GameFailedModalProps {
  open: boolean
  matchedPairs: number
  moves: number
  onRetry: () => void
  onClose: () => void
}

export function GameFailedModal({ open, matchedPairs, moves, onRetry, onClose }: GameFailedModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <div className="text-6xl text-center">⏰</div>
          <DialogTitle className="text-2xl font-bold text-red-600 text-center">¡Tiempo Agotado! ⏱️</DialogTitle>
        </DialogHeader>
        <p className="text-gray-800 text-center">
          Se acabó el tiempo. Encontraste {matchedPairs} de 8 pares en {moves} movimientos.
        </p>
        <DialogFooter>
          <Button onClick={onRetry} className="gap-2 bg-red-600 hover:bg-red-700 w-full">
            <RotateCcw className="w-4 h-4" />
            Intentar de Nuevo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

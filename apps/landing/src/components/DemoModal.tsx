import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@safeping/ui/dialog'
import { X } from 'lucide-react'

interface DemoModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function DemoModal({ isOpen, onClose }: DemoModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>SafePing Demo</DialogTitle>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogHeader>
        <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
          <div className="text-white text-center">
            <p className="text-lg mb-2">Demo Video Player</p>
            <p className="text-sm text-gray-400">Video content would be embedded here</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
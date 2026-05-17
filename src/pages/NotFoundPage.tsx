import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Zap } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-grey-100 flex flex-col items-center justify-center gap-6 p-4">
      <div className="flex items-center justify-center w-16 h-16 bg-gold rounded-2xl">
        <Zap className="h-8 w-8 text-grey-100" />
      </div>
      <div className="text-center">
        <h1 className="font-display text-6xl text-gold mb-2">404</h1>
        <p className="text-lg text-white mb-1">Page not found</p>
        <p className="text-sm text-grey-40">The page you're looking for doesn't exist.</p>
      </div>
      <Button asChild>
        <Link to="/">Back to Dashboard</Link>
      </Button>
    </div>
  )
}

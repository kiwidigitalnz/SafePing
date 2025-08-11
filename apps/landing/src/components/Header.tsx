import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@safeping/ui/button'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold">SafePing</span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/features" className="text-sm font-medium hover:text-primary transition-colors">
              Features
            </Link>
            <Link to="/pricing" className="text-sm font-medium hover:text-primary transition-colors">
              Pricing
            </Link>
            <Link to="/industries" className="text-sm font-medium hover:text-primary transition-colors">
              Industries
            </Link>
            <Link to="/resources" className="text-sm font-medium hover:text-primary transition-colors">
              Resources
            </Link>
            <Link to="/about" className="text-sm font-medium hover:text-primary transition-colors">
              About
            </Link>
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <a href={import.meta.env.VITE_PWA_URL || 'http://localhost:5174'} target="_blank" rel="noopener noreferrer">
                Worker App
              </a>
            </Button>
            <Button variant="ghost" asChild>
              <a href={import.meta.env.VITE_WEB_URL || 'http://localhost:5173'}>
                Sign In
              </a>
            </Button>
            <Button asChild>
              <a href={`${import.meta.env.VITE_WEB_URL || 'http://localhost:5173'}/signup`}>
                Start Free Trial
              </a>
            </Button>
          </div>

          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-b">
            <Link
              to="/features"
              className="block px-3 py-2 text-base font-medium hover:bg-gray-50 rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              to="/pricing"
              className="block px-3 py-2 text-base font-medium hover:bg-gray-50 rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              to="/industries"
              className="block px-3 py-2 text-base font-medium hover:bg-gray-50 rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              Industries
            </Link>
            <Link
              to="/resources"
              className="block px-3 py-2 text-base font-medium hover:bg-gray-50 rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              Resources
            </Link>
            <Link
              to="/about"
              className="block px-3 py-2 text-base font-medium hover:bg-gray-50 rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <div className="pt-4 pb-3 border-t">
              <div className="space-y-2 px-3">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a href={import.meta.env.VITE_PWA_URL || 'http://localhost:5174'} target="_blank" rel="noopener noreferrer">
                    Worker App
                  </a>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <a href={import.meta.env.VITE_WEB_URL || 'http://localhost:5173'}>
                    Sign In
                  </a>
                </Button>
                <Button className="w-full" asChild>
                  <a href={`${import.meta.env.VITE_WEB_URL || 'http://localhost:5173'}/signup`}>
                    Start Free Trial
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
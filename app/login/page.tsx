'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signIn } from '@/lib/actions/auth'
import { Loader2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const result = await signIn(email, password)

    if (result.error) {
      toast.error(result.error)
      setIsLoading(false)
      return
    }

    if (result.success) {
      toast.success('Welcome back!')
      if (result.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/merchant')
      }
    }
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />

        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full border border-white/20" />
          <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full border border-white/20" />
          <div className="absolute top-1/2 left-1/2 w-96 h-96 rounded-full border border-white/10" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-primary-foreground">
          <div className="max-w-md text-center">
            {/* Japanese character */}
            <div className="text-8xl font-light mb-8 opacity-80">氷</div>

            <h1 className="text-4xl font-display mb-4">Kōri Matcha</h1>
            <p className="text-primary-foreground/70 text-lg">
              Premium Japanese Tea
            </p>

            {/* Decorative line */}
            <div className="w-16 h-px bg-accent mx-auto mt-8" />
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md animate-fade-up">
          {/* Mobile brand header */}
          <div className="lg:hidden text-center mb-12">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-primary-foreground font-display">氷</span>
            </div>
            <h1 className="text-2xl font-display text-foreground">Kōri Matcha</h1>
            <p className="text-muted-foreground text-sm mt-1">Staff Portal</p>
          </div>

          {/* Form Header */}
          <div className="hidden lg:block mb-10">
            <h2 className="text-3xl font-display mb-2">Welcome back</h2>
            <p className="text-muted-foreground">
              Sign in to access the staff dashboard
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
                className="h-12 px-4"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="h-12 px-4"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 font-medium group"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-8 border-t border-border/50">
            <p className="text-center text-sm text-muted-foreground">
              Need access? Contact your administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

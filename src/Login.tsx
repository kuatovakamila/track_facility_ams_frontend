import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard'
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, location])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    if (!email || !password) {
      setError('Пожалуйста, заполните все поля')
      setIsSubmitting(false)
      return
    }

    try {
      const success = await login(email, password)
      if (success) {
        const from = location.state?.from?.pathname || '/dashboard'
        navigate(from, { replace: true })
      } else {
        setError('Неверный email или пароль')
      }
    } catch (error) {
      setError('Произошла ошибка при входе')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <header className="border-b border-zinc-800 px-4 sm:px-6 py-4 flex items-center" />

      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-sm sm:max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-xl sm:text-2xl font-bold flex items-center justify-center gap-2">
              Войдите в <span className="text-blue-500 font-bold">ams</span>
            </h1>
            <p className="text-sm text-gray-400 leading-relaxed">
              Используйте свои учетные данные для входа. Если вы новый пользователь, сначала создайте аккаунт.
            </p>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center bg-red-100 border border-red-300 rounded-lg p-3">{error}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-white placeholder-gray-400 focus-visible:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password" className="text-gray-300">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-zinc-900 border-zinc-700 text-white placeholder-gray-400 focus-visible:ring-blue-500"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <label className="flex items-center text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-blue-500 focus:ring-blue-500/20 mr-2"
                />
                Запомнить меня
              </label>
              <a href="#" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">Забыли пароль?</a>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400"
            >
              {isSubmitting ? 'Вход...' : 'Войти'}
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-gray-400">Нет аккаунта? </span>
            <a href="/register" className="text-blue-400 hover:text-blue-300 transition-colors">Зарегистрируйтесь</a>
          </div>
        </div>
      </main>
    </div>
  )
}

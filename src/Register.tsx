import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "./services/api";

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Пожалуйста, заполните все поля.");
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.register({ email, password, full_name: fullName || undefined });
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Ошибка при регистрации");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center" />

      <main className="flex-grow flex items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
              Зарегистрируйся в
              <img
                src="/assets/ams.png"
                alt="AMS Logo"
                className="h-6 sm:h-7 md:h-8 object-contain"
              />
            </h1>
            <p className="text-sm text-gray-400">
              Создай свой аккаунт, чтобы начать использовать
            </p>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Полное имя (необязательно)"
              className="w-full px-4 py-2 rounded-md bg-zinc-800 border border-zinc-700 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@company.com"
              className="w-full px-4 py-2 rounded-md bg-zinc-800 border border-zinc-700 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль"
              className="w-full px-4 py-2 rounded-md bg-zinc-800 border border-zinc-700 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 rounded-md bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed font-medium text-sm"
            >
              {isSubmitting ? "Регистрация..." : "Зарегистрироваться"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400">
            Уже есть аккаунт?{" "}
            <a href="/login" className="text-blue-400 hover:underline">
              Войти
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}

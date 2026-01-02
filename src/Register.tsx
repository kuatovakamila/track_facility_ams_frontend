import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase/supabaseClient";

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Пожалуйста, заполните все поля.");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      console.log("✅ Зарегистрирован!");
      navigate("/dashboard");
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
              className="w-full py-2 rounded-md bg-blue-600 hover:bg-blue-700 font-medium text-sm"
            >
              Зарегистрироваться
            </button>
          </form>

          <p className="text-center text-sm text-gray-400">
            Уже есть аккаунт?{" "}
            <a href="/" className="text-blue-400 hover:underline">
              Войти
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}

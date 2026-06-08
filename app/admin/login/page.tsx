'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Identifiants invalides');
      }

      // Stockage du jeton JWT dans un cookie (valide 1 jour comme ton back)
      Cookies.set('admin_token', data.access_token, { expires: 1, secure: true });

      // Redirection vers ton tableau de bord admin après succès
      router.push('/admin'); 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F5F5DC]/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border-2 border-[#3E2723] rounded-3xl p-8 shadow-md">
        
        <div className="text-center mb-8">
          <h1 className="text-large font-black text-[#3E2723] uppercase tracking-wide">
            Espace Admin
          </h1>
          <p className="text-sm text-[#807F7C] uppercase tracking-widest mt-1">
            Red Eyes Pâtisserie
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold uppercase text-[#3E2723] mb-1">
              Adresse Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#F5F5DC]/30 border border-[#3E2723]/20 p-3 rounded-xl text-base outline-none focus:border-[#3E2723] text-[#3E2723]"
              placeholder="admin@redeyes.fr"
            />
          </div>

          <div>
            <label className="block text-sm font-bold uppercase text-[#3E2723] mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#F5F5DC]/30 border border-[#3E2723]/20 p-3 rounded-xl text-base outline-none focus:border-[#3E2723] text-[#3E2723]"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#3E2723] text-[#FFF9C4] text-base font-bold py-3.5 rounded-xl hover:bg-[#807F7C] transition-colors uppercase tracking-wider disabled:bg-[#807F7C]/40"
          >
            {isLoading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>

      </div>
    </main>
  );
}
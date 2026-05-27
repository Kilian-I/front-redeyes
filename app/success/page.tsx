// app/success/page.tsx
'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function SuccessPage() {
  
  // Dès que la page s'affiche, on nettoie le panier de l'utilisateur
  useEffect(() => {
    // Si tu stockes ton panier dans le localStorage, on le vide ici
    localStorage.removeItem('cart');
    
    // Si tu utilises un état ou un événement pour notifier d'autres composants, 
    // tu peux forcer un rechargement ou vider l'état global ici.
  }, []);

  return (
    <main className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
      {/* Icône de validation visuelle */}
      <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500 text-huge mb-6 animate-bounce">
        ✓
      </div>

      {/* Taille 1 : text-huge pour le titre principal */}
      <h1 className="text-huge font-black uppercase tracking-tight text-black mb-4">
        Commande Validée !
      </h1>

      {/* Taille 2 : text-large pour le message de réassurance */}
      <p className="text-large font-bold text-gray-700 max-w-md mb-2">
        Merci pour votre gourmandise.
      </p>

      {/* Taille 3 : text-base pour les détails et consignes */}
      <p className="text-base text-gray-500 max-w-sm mb-10">
        Votre paiement a été accepté avec succès. Nos pâtissiers préparent vos douceurs, elles arriveront très vite à votre adresse !
      </p>

      {/* Bouton de retour à l'accueil */}
      <Link 
        href="/"
        className="bg-black text-white px-8 py-4 rounded-xl text-base font-bold hover:bg-red-600 transition-colors shadow-sm"
      >
        Retour à la boutique
      </Link>
    </main>
  );
}
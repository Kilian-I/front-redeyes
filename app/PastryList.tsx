'use client';

import { useState } from 'react';

interface Pastry {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string;
}

interface PastryListProps {
  pastries: Pastry[];
}

export default function PastryList({ pastries }: PastryListProps) {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<{ [key: number]: number }>({});
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // --- ÉTATS POUR L'ADRESSE DE LIVRAISON CLIENT ---
  const [addressInput, setAddressInput] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedAddressFeature, setSelectedAddressFeature] = useState<any>(null);

  const handleAddToCart = (pastry: Pastry) => {
    setCart((prevCart) => {
      const currentQty = prevCart[pastry.id] || 0;
      if (currentQty >= pastry.stock) {
        alert(`Désolé, le stock maximal pour les ${pastry.name} est atteint.`);
        return prevCart;
      }
      return { ...prevCart, [pastry.id]: currentQty + 1 };
    });
  };

  const handleRemoveFromCart = (id: number) => {
    setCart((prevCart) => {
      const currentQty = prevCart[id] || 0;
      if (currentQty <= 1) {
        const newCart = { ...prevCart };
        delete newCart[id];
        return newCart;
      }
      return { ...prevCart, [id]: currentQty - 1 };
    });
  };

  // --- RECHERCHE ET SELECTION DE L'ADRESSE CLIENT ---
  const handleAddressChange = async (text: string) => {
    setAddressInput(text);
    if (text.trim().length < 5) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(text)}&limit=5`);
      const data = await res.json();
      setSuggestions(data.features || []);
    } catch (err) {
      console.error("Erreur API Adresse Gouv", err);
    }
  };

  const handleSelectSuggestion = (feature: any) => {
    setAddressInput(feature.properties.label);
    setSelectedAddressFeature(feature);
    setSuggestions([]);
  };

  // --- ENVOI DE LA COMMANDE AU BACK ---
  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    if (!selectedAddressFeature) {
      alert("Veuillez sélectionner votre adresse de livraison dans la liste suggérée.");
      return;
    }

    setIsRedirecting(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cartItems.map(item => ({
            id: item.pastry.id,
            quantity: item.quantity
          })),
          address: selectedAddressFeature.properties,
          coordinates: selectedAddressFeature.geometry.coordinates
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erreur lors de l'initialisation du paiement.");
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("L'URL de paiement Stripe n'a pas pu être générée.");
        setIsRedirecting(false);
      }
    } catch (error: any) {
      console.error("Erreur Checkout Stripe:", error);
      alert(error.message || "Impossible de joindre le serveur de paiement.");
      setIsRedirecting(false);
    }
  };

  const validPastries = Array.isArray(pastries) ? pastries : [];
  const filteredPastries = validPastries.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const cartItems = Object.entries(cart).map(([id, qty]) => {
    const pastry = validPastries.find((p) => p.id === Number(id));
    return { pastry, quantity: qty };
  }).filter(item => item.pastry !== undefined) as { pastry: Pastry; quantity: number }[];

  const totalAmount = cartItems.reduce((sum, item) => sum + (item.pastry.price * item.quantity), 0);
  const totalQuantity = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Fonction de rendu du panier (Appelée directement pour préserver le focus du DOM)
  const renderCartContent = () => (
    <div className="flex flex-col h-full justify-between">
      <div className="flex flex-col h-full overflow-hidden">
        <h2 className="text-large font-black uppercase border-b-2 border-[#3E2723] pb-3 mb-4 flex justify-between items-center flex-shrink-0 text-[#3E2723]">
          <span>Votre Panier</span>
          <span className="bg-[#3E2723] text-[#FFF9C4] font-mono text-base px-2.5 py-0.5 rounded-full">
            {totalQuantity}
          </span>
        </h2>

        <div className="flex-1 overflow-y-auto pr-1 mb-4">
          {cartItems.length > 0 ? (
            <ul className="space-y-3">
              {cartItems.map((item) => (
                <li key={item.pastry.id} className="flex justify-between items-center bg-[#FFF9C4]/30 p-3 rounded-xl border border-[#3E2723]/10">
                  <div className="max-w-[55%]">
                    <p className="text-base font-bold uppercase truncate text-[#3E2723]">{item.pastry.name}</p>
                    <p className="text-sm text-[#807F7C] font-mono">{(item.pastry.price * item.quantity).toFixed(2)} €</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white border border-[#3E2723]/20 rounded-lg p-1 shadow-sm">
                    <button disabled={isRedirecting} onClick={() => handleRemoveFromCart(item.pastry.id)} className="w-6 h-6 flex items-center justify-center bg-[#F5F5DC] hover:bg-[#3E2723] hover:text-[#FFF9C4] rounded text-sm font-bold text-[#3E2723] transition-colors">-</button>
                    <span className="text-base font-mono font-bold w-6 text-center text-[#3E2723]">{item.quantity}</span>
                    <button disabled={isRedirecting || item.quantity >= item.pastry.stock} onClick={() => handleAddToCart(item.pastry)} className="w-6 h-6 flex items-center justify-center bg-[#F5F5DC] hover:bg-[#3E2723] hover:text-[#FFF9C4] rounded text-sm font-bold text-[#3E2723] transition-colors disabled:opacity-30">+</button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-14 text-center">
              <p className="text-base text-[#807F7C] italic">Votre panier attend vos gourmandises.</p>
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="border-t-2 border-dashed border-[#3E2723]/20 pt-4 mb-2 flex-shrink-0 relative">
            <label className="block text-base font-bold mb-1 text-[#3E2723] uppercase tracking-tight">Adresse de Livraison</label>
            <input
              type="text"
              required
              disabled={isRedirecting}
              placeholder="Saisissez votre rue pour la livraison..."
              className="w-full bg-[#F5F5DC]/40 border border-[#3E2723]/20 p-2.5 rounded-xl text-base outline-none focus:border-[#3E2723] transition-colors text-[#3E2723]"
              value={addressInput}
              onChange={(e) => handleAddressChange(e.target.value)}
            />

            {suggestions.length > 0 && (
              <ul className="absolute bottom-full left-0 right-0 bg-white border-2 border-[#3E2723] mb-2 rounded-xl shadow-2xl max-h-40 overflow-y-auto z-50">
                {suggestions.map((s, idx) => (
                  <li
                    key={idx}
                    className="p-2.5 text-sm hover:bg-[#FFF9C4]/40 cursor-pointer border-b border-[#3E2723]/10 last:border-0 font-medium text-[#3E2723]"
                    onClick={() => handleSelectSuggestion(s)}
                  >
                    {s.properties.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {cartItems.length > 0 && (
        <div className="border-t-2 border-[#3E2723] pt-4 bg-white space-y-3 flex-shrink-0">
          <div className="flex justify-between items-baseline">
            <span className="text-base uppercase font-bold text-[#807F7C]">Total Global</span>
            <span className="text-large font-mono font-black text-[#3E2723]">{totalAmount.toFixed(2)} €</span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={isRedirecting}
            className="w-full bg-[#3E2723] text-[#FFF9C4] text-base font-bold py-4 rounded-xl hover:bg-[#807F7C] transition-colors uppercase tracking-wider shadow-md disabled:bg-[#807F7C]/40 disabled:text-white"
          >
            {isRedirecting ? 'Vérification & Stripe...' : 'Valider ma commande'}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <section className="py-6 px-4 md:px-0 bg-[#F5F5DC]/10 min-h-screen relative">

      {/* 📱 BOUTON PANIER FLOTTANT MOBILE */}
      <div className="lg:hidden fixed top-4 right-4 z-40">
        <button
          onClick={() => setIsMobileCartOpen(true)}
          className="bg-[#3E2723] text-[#FFF9C4] p-3.5 rounded-full shadow-2xl flex items-center justify-center relative hover:scale-105 active:scale-95 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          {totalQuantity > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#FFF9C4] text-[#3E2723] font-mono font-black text-xs w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#3E2723]">
              {totalQuantity}
            </span>
          )}
        </button>
      </div>

      {/* 📱 TIROIR LATÉRAL PANIER POUR MOBILE */}
      {isMobileCartOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMobileCartOpen(false)} />

          <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white p-6 shadow-2xl flex flex-col justify-between border-l-4 border-[#3E2723]">
            <button
              onClick={() => setIsMobileCartOpen(false)}
              className="absolute top-4 right-4 text-[#3E2723] p-1 hover:bg-[#F5F5DC] rounded-lg transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="h-full pt-6">
              {renderCartContent()}
            </div>
          </div>
        </div>
      )}

      {/* GRILLE D'AFFICHAGE PRINCIPALE */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-10 items-start">

        {/* CATALOGUE DE PÂTISSERIES */}
        <div className="lg:col-span-7">
          <div className="mb-8 max-w-md">
            <input
              type="text"
              placeholder="Rechercher une pâtisserie..."
              className="w-full bg-[#F5F5DC]/30 border border-[#3E2723]/20 p-3 rounded-xl text-base outline-none focus:border-[#3E2723] transition-colors text-[#3E2723] placeholder-[#807F7C]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPastries.map((p) => {
              const isOutOfStock = p.stock <= 0;
              const quantityInCart = cart[p.id] || 0;

              return (
                <div
                  key={p.id}
                  className={`border border-[#3E2723]/10 p-6 rounded-2xl shadow-sm bg-white flex flex-col justify-between transition-all hover:border-[#3E2723]/30 hover:shadow-md ${isOutOfStock ? 'opacity-60 grayscale-[30%]' : ''
                    }`}
                >
                  <div>
                    {p.imageUrl && (
                      <div className="w-full h-44 bg-[#F5F5DC]/20 rounded-xl overflow-hidden mb-4 relative border border-[#3E2723]/5">
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                        {isOutOfStock && (
                          <span className="absolute top-3 right-3 bg-[#3E2723] text-[#FFF9C4] text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                            Épuisé
                          </span>
                        )}
                      </div>
                    )}
                    <h3 className="text-large font-black uppercase text-[#3E2723] mb-1 tracking-wide">{p.name}</h3>
                    <p className="text-base text-[#807F7C] mb-4 line-clamp-2">{p.description}</p>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-[#3E2723]/10 mt-4">
                    <div className="flex flex-col">
                      <span className="text-large font-mono font-black text-[#3E2723]">{p.price.toFixed(2)} €</span>
                      {quantityInCart > 0 && (
                        <span className="text-xs font-bold text-[#3E2723] bg-[#FFF9C4] px-2 py-0.5 rounded mt-1 font-mono w-fit">Panier : {quantityInCart}</span>
                      )}
                    </div>

                    <button
                      onClick={() => handleAddToCart(p)}
                      disabled={isOutOfStock || quantityInCart >= p.stock || isRedirecting}
                      className={`px-5 py-2.5 rounded-xl text-base font-bold transition-all uppercase tracking-wider text-sm ${isOutOfStock || quantityInCart >= p.stock
                          ? 'bg-[#F5F5DC] text-[#807F7C] cursor-not-allowed border border-transparent'
                          : 'bg-[#3E2723] text-[#FFF9C4] hover:bg-[#807F7C] hover:text-white'
                        }`}
                    >
                      {isOutOfStock ? 'Rupture' : quantityInCart >= p.stock ? 'Max' : 'Ajouter'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 💻 PANIER DESKTOP ACCESSIBLE À DROITE */}
        <div className="hidden lg:block lg:col-span-3 bg-white border-2 border-[#3E2723] p-6 rounded-3xl shadow-md sticky top-6 h-[calc(100vh-40px)]">
          {renderCartContent()}
        </div>

      </div>
    </section>
  );
}
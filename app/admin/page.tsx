'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

interface Pastry {
  id: number;
  name: string;
  imageUrl?: string;
}

interface OrderLine {
  id: number;
  quantity: number;
  price: number;
  pastryId: number;
  pastry?: Pastry;
}

interface Order {
  id: number;
  stripeSessionId: string;
  customerEmail: string | null;
  totalAmount: number;
  deliveryName: string | null;
  streetNumber: string | null;
  streetName: string | null;
  postalCode: string | null;
  city: string | null;
  createdAt: string;
  isCompleted: boolean;
  lines: OrderLine[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<'todo' | 'done'>('todo');

  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [distanceMax, setDistanceMax] = useState('15');
  const [shopAddressInput, setShopAddressInput] = useState('');
  const [shopSuggestions, setShopSuggestions] = useState<any[]>([]);
  const [shopGeo, setShopGeo] = useState({ lat: 49.2583, lon: 4.0317 });
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '0',
    imageUrl: ''
  });

  // Extraction centralisée du token pour sécuriser les en-têtes
  const getAuthHeaders = (contentType = true) => {
    const token = Cookies.get('admin_token');
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`
    };
    if (contentType) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  };

  useEffect(() => {
    const token = Cookies.get('admin_token');
    if (!token) {
      router.push('/admin/login');
    } else {
      setIsAuthorized(true);
      fetchProducts();
      fetchShopConfig();
      fetchOrders();
    }
  }, [router]);

  const fetchProducts = async () => {
    try {
      const res = await fetch('http://localhost:3000/pastries/admin', {
        headers: getAuthHeaders(false)
      });
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erreur fetch pastries admin", err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('http://localhost:3000/payments/orders', {
        headers: getAuthHeaders(false)
      });
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erreur fetch orders", err);
      setOrders([]);
    }
  };

  const handleToggleStatus = async (orderId: number, currentStatus: boolean) => {
    try {
      const res = await fetch(`http://localhost:3000/payments/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isCompleted: !currentStatus })
      });

      if (res.ok) {
        setOrders((prevOrders) =>
          prevOrders.map((o) => (o.id === orderId ? { ...o, isCompleted: !currentStatus } : o))
        );
      } else {
        alert("Erreur lors de la mise à jour du statut.");
      }
    } catch (err) {
      console.error("Erreur statut :", err);
    }
  };

  const fetchShopConfig = async () => {
    try {
      const res = await fetch('http://localhost:3000/payments/config', {
        headers: getAuthHeaders(false)
      });
      const data = await res.json();
      if (data) {
        setDistanceMax(data.distanceMaxKm.toString());
        setShopAddressInput(data.boutiqueAddress);
        setShopGeo({ lat: data.boutiqueLat, lon: data.boutiqueLon });
      }
    } catch (err) {
      console.error("Erreur récupération config", err);
    }
  };

  const handleShopAddressChange = async (text: string) => {
    setShopAddressInput(text);
    if (text.trim().length < 4) {
      setShopSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(text)}&limit=5`);
      const data = await res.json();
      setShopSuggestions(data.features || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectShopSuggestion = (s: any) => {
    setShopAddressInput(s.properties.label);
    setShopGeo({
      lat: s.geometry.coordinates[1],
      lon: s.geometry.coordinates[0]
    });
    setShopSuggestions([]);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    try {
      const response = await fetch('http://localhost:3000/payments/config', {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          distanceMaxKm: parseFloat(distanceMax),
          boutiqueAddress: shopAddressInput,
          boutiqueLat: shopGeo.lat,
          boutiqueLon: shopGeo.lon
        }),
      });

      if (response.ok) {
        alert('Configuration de la livraison enregistrée !');
        fetchShopConfig();
      } else {
        alert('Erreur lors de la sauvegarde.');
      }
    } catch (error) {
      alert('Impossible de joindre le serveur.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isEditing = editingId !== null;
    const url = isEditing ? `http://localhost:3000/pastries/${editingId}` : 'http://localhost:3000/pastries';
    const method = isEditing ? 'PATCH' : 'POST';

    const payload = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price) || 0,
      stock: parseInt(formData.stock) || 0,
      imageUrl: formData.imageUrl.trim() !== '' ? formData.imageUrl : null 
    };

    try {
      const response = await fetch(url, {
        method: method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert(isEditing ? 'Produit modifié avec succès !' : 'Produit créé avec succès !');
        resetForm();
        fetchProducts();
      } else {
        const errorData = await response.json();
        alert(`Erreur serveur : ${errorData.message || 'Impossible de traiter la demande.'}`);
      }
    } catch (err) {
      alert("Impossible de joindre le serveur de pâtisseries.");
    }
  };

  const handleQuickStock = async (id: number, currentStock: number, change: number) => {
    const newStock = Math.max(0, currentStock + change);
    await fetch(`http://localhost:3000/pastries/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ stock: newStock }),
    });
    fetchProducts();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Voulez-vous vraiment archiver ce produit ?')) {
      const response = await fetch(`http://localhost:3000/pastries/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(false)
      });
      if (response.ok) fetchProducts();
    }
  };

  const startEdit = (product: any) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock.toString(),
      imageUrl: product.imageUrl || ''
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ name: '', description: '', price: '', stock: '0', imageUrl: '' });
  };

  const handleLogout = () => {
    Cookies.remove('admin_token');
    router.push('/admin/login');
  };

  if (!isAuthorized) return null;

  const validOrders = Array.isArray(orders) ? orders : [];
  const todoOrders = validOrders.filter(o => !o.isCompleted);
  const doneOrders = validOrders.filter(o => o.isCompleted);
  const displayedOrders = activeTab === 'todo' ? todoOrders : doneOrders;

  return (
    <main className="max-w-7xl mx-auto p-4 md:p-10 bg-[#F5F5DC]/10 min-h-screen">
      
      {/* --- TYPO TAILLE 1 : EN-TÊTE PRINCIPAL (#3E2723) --- */}
      <div className="flex justify-between items-center mb-10 border-b-2 border-[#3E2723] pb-4">
        <h1 className="text-huge font-black uppercase tracking-tight text-[#3E2723]">Gestion Boutique</h1>
        <button
          onClick={handleLogout}
          className="text-base text-[#807F7C] hover:text-[#3E2723] font-bold uppercase transition-colors"
        >
          Déconnexion
        </button>
      </div>

      {/* PARAMÈTRES DE LIVRAISON */}
      <section className="bg-white border-2 border-[#3E2723]/20 rounded-3xl p-6 mb-10 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          {/* --- TYPO TAILLE 2 : SOUS-TITRE DE ZONE --- */}
          <h2 className="text-large font-black uppercase text-[#3E2723]">Paramètres de Livraison</h2>
          <span className="text-sm bg-[#F5F5DC] px-2.5 py-1 rounded-lg font-mono font-bold text-[#3E2723]">
            GPS : {shopGeo.lat.toFixed(4)}, {shopGeo.lon.toFixed(4)}
          </span>
        </div>

        {/* --- TYPO TAILLE 3 : CONTENU DES FORMULAIRES --- */}
        <form onSubmit={handleSaveConfig} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end relative text-base">
          <div className="relative">
            <label className="block font-bold mb-1 text-[#3E2723] uppercase text-sm">Adresse de référence</label>
            <input
              type="text"
              required
              placeholder="Ex: Rue de la Paix, Reims"
              className="w-full bg-[#F5F5DC]/30 border border-[#3E2723]/20 p-2.5 rounded-xl outline-none focus:border-[#3E2723] text-[#3E2723]"
              value={shopAddressInput}
              onChange={e => handleShopAddressChange(e.target.value)}
            />
            {shopSuggestions.length > 0 && (
              <ul className="absolute z-50 left-0 right-0 bg-white border-2 border-[#3E2723] mt-1 rounded-xl shadow-2xl max-h-40 overflow-y-auto">
                {shopSuggestions.map((s, idx) => (
                  <li
                    key={idx}
                    className="p-2.5 hover:bg-[#FFF9C4]/40 cursor-pointer border-b border-[#3E2723]/10 last:border-0 font-medium text-[#3E2723]"
                    onClick={() => handleSelectShopSuggestion(s)}
                  >
                    {s.properties.label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="block font-bold mb-1 text-[#3E2723] uppercase text-sm">Rayon max (km)</label>
            <input
              type="number"
              required
              min="1"
              className="w-full bg-[#F5F5DC]/30 border border-[#3E2723]/20 p-2.5 rounded-xl outline-none focus:border-[#3E2723] text-[#3E2723] font-mono"
              value={distanceMax}
              onChange={e => setDistanceMax(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isSavingConfig}
            className="w-full bg-[#3E2723] text-[#FFF9C4] py-3 rounded-xl font-bold uppercase tracking-wider hover:bg-[#807F7C] transition-colors disabled:bg-[#807F7C]/40"
          >
            {isSavingConfig ? 'Mise à jour...' : 'Sauvegarder la Zone'}
          </button>
        </form>
      </section>

      {/* SUIVI DES COMMANDES */}
      <section className="mb-14 bg-white border-2 border-[#3E2723] rounded-3xl p-6 shadow-sm">
        <h2 className="text-large font-black mb-6 uppercase tracking-wide text-[#3E2723]">Suivi des commandes</h2>

        <div className="flex gap-6 border-b border-[#3E2723]/10 mb-6">
          <button
            onClick={() => setActiveTab('todo')}
            className={`pb-2 text-large font-bold uppercase transition-all ${activeTab === 'todo' ? 'border-b-4 border-[#3E2723] text-[#3E2723]' : 'text-[#807F7C]'}`}
          >
            📦 À Préparer ({todoOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('done')}
            className={`pb-2 text-large font-bold uppercase transition-all ${activeTab === 'done' ? 'border-b-4 border-[#3E2723] text-[#3E2723]' : 'text-[#807F7C]'}`}
          >
            ✅ Livrées ({doneOrders.length})
          </button>
        </div>

        <div className="overflow-x-auto text-base">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#3E2723]/10 text-[#807F7C] uppercase font-black text-sm">
                <th className="pb-3 w-12">ID</th>
                <th className="pb-3 w-56">Client</th>
                <th className="pb-3 w-64">Adresse</th>
                <th className="pb-3">Gâteaux</th>
                <th className="pb-3 w-28">Total</th>
                <th className="pb-3 text-center w-36">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3E2723]/5">
              {displayedOrders.length > 0 ? (
                displayedOrders.map((order: Order) => (
                  <tr key={order.id} className="hover:bg-[#F5F5DC]/10 transition-colors">
                    <td className="py-4 font-mono font-bold text-[#807F7C]">#{order.id}</td>
                    <td className="py-4">
                      <p className="font-black text-[#3E2723] uppercase truncate max-w-[200px]">{order.deliveryName || 'Client'}</p>
                      <p className="font-mono text-[#807F7C] text-sm truncate max-w-[200px]">{order.customerEmail}</p>
                    </td>
                    <td className="py-4">
                      <p className="font-bold text-[#3E2723]">{order.streetNumber} {order.streetName}</p>
                      <p className="text-xs font-bold text-[#807F7C] uppercase">{order.postalCode} {order.city}</p>
                    </td>
                    <td className="py-4">
                      <div className="flex flex-col gap-2 max-w-sm">
                        {order.lines?.map((line) => (
                          <div key={line.id} className="flex items-center gap-2 bg-[#FFF9C4]/20 border border-[#3E2723]/10 p-2 rounded-xl">
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-[#3E2723] uppercase truncate">
                                <span className="text-[#3E2723] font-black font-mono mr-1">{line.quantity}x</span> 
                                {line.pastry?.name || `Gâteau #${line.pastryId}`}
                              </p>
                              <p className="text-xs text-[#807F7C] font-mono">P.U : {line.price.toFixed(2)} €</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 font-mono font-black text-[#3E2723]">{order.totalAmount.toFixed(2)} €</td>
                    <td className="py-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(order.id, order.isCompleted)}
                        className={`w-full py-2 rounded-xl font-black uppercase tracking-wider border transition-all text-sm ${
                          order.isCompleted
                            ? 'bg-[#F5F5DC]/40 text-[#807F7C] border-[#3E2723]/10 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                            : 'bg-[#FFF9C4]/60 text-[#3E2723] border-[#3E2723]/30 hover:bg-[#3E2723] hover:text-[#FFF9C4]'
                        }`}
                      >
                        {order.isCompleted ? 'Reculer' : 'Fait'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-14 text-[#807F7C] italic">Aucune commande enregistrée.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* INTERFACE CRUD PRODUITS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 text-base">
        {/* Formulaire Produit */}
        <div className="bg-white p-6 border-2 border-[#3E2723]/20 rounded-3xl h-fit shadow-sm">
          <h2 className="text-large font-black mb-6 uppercase text-[#3E2723]">{editingId ? 'Modifier gâteau' : 'Nouveau Gâteau'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-bold mb-1 text-[#3E2723] text-sm uppercase">Nom</label>
              <input type="text" required className="w-full bg-[#F5F5DC]/20 border border-[#3E2723]/20 p-2.5 rounded-xl outline-none focus:border-[#3E2723] text-[#3E2723]" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div>
              <label className="block font-bold mb-1 text-[#3E2723] text-sm uppercase">Description</label>
              <textarea required className="w-full bg-[#F5F5DC]/20 border border-[#3E2723]/20 p-2.5 rounded-xl h-20 outline-none focus:border-[#3E2723] text-[#3E2723]" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold mb-1 text-[#3E2723] text-sm uppercase">Prix (€)</label>
                <input type="number" step="0.01" required className="w-full bg-[#F5F5DC]/20 border border-[#3E2723]/20 p-2.5 rounded-xl outline-none focus:border-[#3E2723] text-[#3E2723] font-mono" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
              </div>
              <div>
                <label className="block font-bold mb-1 text-[#3E2723] text-sm uppercase">Stock</label>
                <input type="number" required className="w-full bg-[#F5F5DC]/20 border border-[#3E2723]/20 p-2.5 rounded-xl outline-none focus:border-[#3E2723] text-[#3E2723] font-mono" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block font-bold mb-1 text-[#3E2723] text-sm uppercase">URL Image (Optionnel)</label>
              <input type="text" className="w-full bg-[#F5F5DC]/20 border border-[#3E2723]/20 p-2.5 rounded-xl outline-none focus:border-[#3E2723] text-[#3E2723]" value={formData.imageUrl} onChange={e => setFormData({ ...formData, imageUrl: e.target.value })} />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" className="flex-1 bg-[#3E2723] text-[#FFF9C4] py-3 rounded-xl font-bold uppercase tracking-wider hover:bg-[#807F7C] transition-colors">
                {editingId ? 'Sauvegarder' : 'Créer'}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} className="bg-[#F5F5DC] text-[#3E2723] px-4 rounded-xl font-bold hover:bg-[#3E2723]/10 uppercase tracking-wide text-sm">
                  Annuler
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Table de consultation des Produits Actifs */}
        <div className="lg:col-span-2 bg-white border-2 border-[#3E2723]/20 rounded-3xl p-6 shadow-sm overflow-x-auto">
          <h2 className="text-large font-black mb-6 uppercase text-[#3E2723]">Produits en vente</h2>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#3E2723]/10 text-[#807F7C] uppercase font-black text-sm">
                <th className="pb-3">Nom</th>
                <th className="pb-3">Prix</th>
                <th className="pb-3 text-center">Stock</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3E2723]/5">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-[#F5F5DC]/10 transition-colors">
                  <td className="py-4 font-bold text-[#3E2723] uppercase">{p.name}</td>
                  <td className="py-4 font-mono text-[#3E2723]">{p.price.toFixed(2)} €</td>
                  <td className="py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleQuickStock(p.id, p.stock, -1)} className="px-2 py-0.5 bg-[#F5F5DC] rounded text-[#3E2723] hover:bg-[#3E2723] hover:text-[#FFF9C4] font-bold">-</button>
                      <span className="font-mono font-bold w-8 text-center text-[#3E2723]">{p.stock}</span>
                      <button onClick={() => handleQuickStock(p.id, p.stock, 1)} className="px-2 py-0.5 bg-[#F5F5DC] rounded text-[#3E2723] hover:bg-[#3E2723] hover:text-[#FFF9C4] font-bold">+</button>
                    </div>
                  </td>
                  <td className="py-4 text-right space-x-2 whitespace-nowrap text-sm font-bold">
                    <button onClick={() => startEdit(p)} className="bg-[#F5F5DC] text-[#3E2723] hover:bg-[#3E2723] hover:text-[#FFF9C4] px-3 py-1.5 rounded-lg transition-all uppercase">Éditer</button>
                    <button onClick={() => handleDelete(p.id)} className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-lg transition-all uppercase">Archiver</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
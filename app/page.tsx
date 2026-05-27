import PastryList from './PastryList';

export default async function Home() {
  // Le fetch se fait côté serveur, ultra rapide
  const res = await fetch('http://localhost:3000/pastries', { cache: 'no-store' });
  const pastries = await res.json();

  const safePastries = Array.isArray(pastries) ? pastries : [];

  return (
    <main className="min-h-screen bg-[#F5F5DC]/10 max-w-7xl mx-auto p-4 md:p-10">
      
      {/* --- TYPO TAILLE 1 : TITRE DE MARQUE REFONDUE (#3E2723) --- */}
      <div className="border-b-2 border-[#3E2723]/10 pb-4 mb-8">
        <h1 className="text-huge font-black text-[#3E2723] uppercase tracking-tighter">
          RED EYES
        </h1>
        <p className="text-base text-[#807F7C] font-medium uppercase tracking-widest mt-1">
          Pâtisserie Fine & Livraisons Locales
        </p>
      </div>
      
      {/* Données brutes injectées dans le catalogue interactif et responsive */}
      <PastryList pastries={safePastries} />
    </main>
  );
}
import Image from 'next/image';
import PastryList from './PastryList';

export default async function Home() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pastries`, { cache: 'no-store' });
  const pastries = await res.json();

  const safePastries = Array.isArray(pastries) ? pastries : [];

  return (
    <main className="min-h-screen bg-[#F5F5DC]/10 max-w-7xl mx-auto p-4 md:p-10">
      
      {/* --- EN-TÊTE OPTIMISÉ AVEC LOGO ALIGNÉ --- */}
<div className="border-b-2 border-[#3E2723]/10 pb-6 mb-8">
  <div className="flex items-center gap-4">
    {/* Conteneur du logo : w-16 équivaut à 64px de large */}
    <div className="relative w-16 h-16 shrink-0 overflow-hidden rounded-full border border-[#3E2723]/10">
      <Image 
        src="/images/redeyesLogo.jpg" 
        alt="Logo RedEyes" 
        fill
        sizes="64px" // 👈 INDIQUE À NEXT.JS LA TAILLE EXACTE À CHARGER
        className="object-cover"
        priority
      />
    </div>

    {/* Titre de marque et baseline */}
    <div className="flex flex-col justify-center">
      <h1 className="text-huge font-black text-[#3E2723] uppercase tracking-tighter leading-none">
        RED EYES
      </h1>
      <p className="text-base text-[#807F7C] font-medium uppercase tracking-widest mt-1">
        Pâtisserie Fine & Livraisons Locales
      </p>
    </div>
  </div>
</div>
      
      {/* Catalogue */}
      <PastryList pastries={safePastries} />
    </main>
  );
}
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename) {
    return NextResponse.json({ error: 'Le nom du fichier est requis' }, { status: 400 });
  }

  try {
    const stream = request.body;

    if (!stream) {
      return NextResponse.json({ error: 'Le contenu du fichier est vide' }, { status: 400 });
    }

    // Avec @vercel/blob@latest, 'put' détecte tout seul l'OIDC de Vercel en prod !
    const blob = await put(filename, stream, {
      access: 'public',
    });

    return NextResponse.json(blob);
  } catch (error: any) {
    console.error("Erreur détaillée Vercel Blob :", error);
    return NextResponse.json({ error: 'Upload failed', message: error.message }, { status: 500 });
  }
}
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename) {
    return NextResponse.json({ error: 'Le nom du fichier est requis' }, { status: 400 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("ERREUR CRUCIALE : Le token BLOB_READ_WRITE_TOKEN est introuvable !");
    return NextResponse.json({ error: 'Configuration Stripe/Blob manquante sur le serveur' }, { status: 500 });
  }

  try {
    // request.body est un ReadableStream binaire, ce que 'put' accepte parfaitement
    const stream = request.body;

    if (!stream) {
      return NextResponse.json({ error: 'Le contenu du fichier est vide' }, { status: 400 });
    }

    // On passe le flux directement à Vercel Blob
    const blob = await put(filename, stream, {
      access: 'public',
    });

    return NextResponse.json(blob);
  } catch (error: any) {
    console.error("Erreur détaillée Vercel Blob :", error);
    return NextResponse.json({ error: 'Upload failed', message: error.message }, { status: 500 });
  }
  
}
import type { MetadataRoute } from 'next';
import { buildSitePath } from '@/lib/metadata';

export const dynamic = 'force-static';

const resolveManifestPath = (path: string) => buildSitePath(path);

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Suayb's Blog",
    short_name: 'Suayb Blog',
    description: 'Articles, tutorials, and notes about backend, frontend, cloud, and software engineering.',
    start_url: resolveManifestPath(''),
    scope: resolveManifestPath(''),
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0d6efd',
    categories: ['education', 'productivity', 'technology'],
    icons: [
      {
        src: resolveManifestPath('favicon-192x192.png'),
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: resolveManifestPath('favicon-192x192.png'),
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: resolveManifestPath('icon-512x512.png'),
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: resolveManifestPath('icon-512x512.png'),
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}

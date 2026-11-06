import type { Metadata } from 'next';
import LocaleNotFoundPage from '@/views/LocaleNotFoundPage';
import { buildNotFoundMetadata } from '@/lib/metadata';

export const metadata: Metadata = buildNotFoundMetadata();

export default function Localized404Page() {
  return <LocaleNotFoundPage />;
}

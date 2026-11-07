import { stripLeadingSlashes, stripTrailingSlashes } from '@/lib/urlPath';

const normalizeBasePath = () => stripTrailingSlashes(stripLeadingSlashes(process.env.NEXT_PUBLIC_BASE_PATH ?? ''));

export const getBasePathPrefix = () => {
  const basePath = normalizeBasePath();
  return basePath ? `/${basePath}` : '';
};

export const withBasePath = (pathname: string) => {
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const prefix = getBasePathPrefix();

  if (!prefix) {
    return normalizedPath;
  }

  if (normalizedPath === '/') {
    return prefix;
  }

  if (normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`)) {
    return normalizedPath;
  }

  return `${prefix}${normalizedPath}`;
};

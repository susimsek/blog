'use client';

import { useTranslation } from 'react-i18next';
import { defaultLocale } from '@/i18n/settings';
import { getPostCategoryPresentation } from '@/lib/postCategories';
import type { PostCategoryRef } from '@/types/posts';
import Link from '@/components/common/Link';

interface PostCategoryBadgeProps {
  category?: PostCategoryRef | null;
  className?: string;
  linked?: boolean;
}

export default function PostCategoryBadge({ category, className, linked = true }: Readonly<PostCategoryBadgeProps>) {
  const { i18n } = useTranslation();
  const resolvedLanguage = i18n?.resolvedLanguage ?? i18n?.language ?? defaultLocale;
  const presentation = getPostCategoryPresentation(category, resolvedLanguage);

  if (!presentation) {
    return null;
  }

  const classNames = ['post-category-link', `post-category-link-${presentation.color}`, className]
    .filter(Boolean)
    .join(' ');
  const label = presentation.label;

  if (!linked) {
    return (
      <span className={classNames} title={label}>
        {label}
      </span>
    );
  }

  return (
    <Link href={`/categories/${presentation.slug}`} className={classNames}>
      {label}
    </Link>
  );
}

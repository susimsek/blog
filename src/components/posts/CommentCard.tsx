'use client';

import React from 'react';
import Card from 'react-bootstrap/Card';
import { useTranslation } from 'react-i18next';
import { formatCommentDate, getCommentInitial, renderCommentContent } from '@/components/posts/commentFormatting';
import type { CommentItem } from '@/types/comments';

type CommentCardProps = {
  comment: CommentItem;
  locale: string;
  replyButton?: React.ReactNode;
  metaBadge?: React.ReactNode;
};

export default function CommentCard({ comment, locale, replyButton, metaBadge }: Readonly<CommentCardProps>) {
  const { t } = useTranslation('post');
  const [isAvatarBroken, setIsAvatarBroken] = React.useState(false);

  React.useEffect(() => {
    setIsAvatarBroken(false);
  }, [comment.avatarUrl]);

  return (
    <Card className="post-card shadow-none border-0 post-comment-card">
      <Card.Body className="post-comment-card-body">
        <div className="post-comment-card-head">
          <div className="post-comment-author">
            <div className="post-comment-avatar" aria-hidden="true">
              {comment.avatarUrl && !isAvatarBroken ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={comment.avatarUrl}
                  className="post-comment-avatar-image"
                  src={comment.avatarUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                  onLoad={() => setIsAvatarBroken(false)}
                  onError={() => setIsAvatarBroken(true)}
                />
              ) : (
                <span className="post-comment-avatar-fallback">{getCommentInitial(comment.authorName)}</span>
              )}
            </div>
            <div className="post-comment-author-meta">
              <div className="post-comment-author-row">
                <h4 className="h6 mb-1">{comment.authorName}</h4>
                {metaBadge}
              </div>
              <small className="text-muted">
                {t('post.comments.postedAt', { date: formatCommentDate(comment.createdAt, locale) })}
              </small>
            </div>
          </div>
        </div>
        <p className="mb-0 text-break post-comment-content">{renderCommentContent(comment.content)}</p>
        {replyButton ? <div className="post-comment-actions">{replyButton}</div> : null}
      </Card.Body>
    </Card>
  );
}

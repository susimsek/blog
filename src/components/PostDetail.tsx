// components/PostDetail.tsx
import { Post } from '@/types/posts';

export default function PostDetail({ postData }: { postData: Post }) {
  return (
    <div className="container mt-5">
      <h1>{postData.title}</h1>
      <div>{postData.date}</div>
      <div dangerouslySetInnerHTML={{ __html: postData.contentHtml }} />
    </div>
  );
}

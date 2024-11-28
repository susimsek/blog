// components/PostList.tsx
import Link from 'next/link';
import { Post } from '@/types/posts';

export default function PostList({ posts }: { posts: Post[] }) {
  return (
    <ul className="list-group">
      {posts.map(({ id, title, date }) => (
        <li className="list-group-item" key={id}>
          <Link href={`/posts/${id}`}>{title}</Link>
          <br />
          <small>{date}</small>
        </li>
      ))}
    </ul>
  );
}

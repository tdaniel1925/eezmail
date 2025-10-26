import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Eye, TrendingUp } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  slug: string;
  views: number;
}

interface PopularArticlesProps {
  articles: Article[];
}

export function PopularArticles({ articles }: PopularArticlesProps) {
  return (
    <div className="space-y-2">
      {articles.map((article, index) => (
        <Link
          key={article.id}
          href={`/help/${article.slug}`}
          className="flex items-center gap-4 rounded-lg border bg-white p-4 transition-all hover:shadow-md hover:border-primary/50"
        >
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {index + 1}
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 hover:text-primary">
              {article.title}
            </h4>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Eye className="h-4 w-4" />
            {article.views}
          </div>
        </Link>
      ))}
    </div>
  );
}

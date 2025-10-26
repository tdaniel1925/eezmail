import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
}

interface RelatedArticlesProps {
  articles: Article[];
}

export function RelatedArticles({ articles }: RelatedArticlesProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {articles.map((article) => (
        <Link key={article.id} href={`/help/${article.slug}`}>
          <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50">
            <CardHeader>
              <CardTitle className="text-lg">{article.title}</CardTitle>
            </CardHeader>
            {article.excerpt && (
              <CardContent>
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                  {article.excerpt}
                </p>
                <div className="flex items-center gap-1 text-sm text-primary font-medium">
                  Read more
                  <ArrowRight className="h-4 w-4" />
                </div>
              </CardContent>
            )}
          </Card>
        </Link>
      ))}
    </div>
  );
}

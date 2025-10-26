import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  views: number;
}

interface FeaturedArticlesProps {
  articles: Article[];
}

export function FeaturedArticles({ articles }: FeaturedArticlesProps) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {articles.map((article) => (
        <Link key={article.id} href={`/help/${article.slug}`}>
          <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50">
            <CardHeader>
              <div className="mb-2 flex items-center gap-2">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <Badge variant="secondary" className="text-xs">
                  Featured
                </Badge>
              </div>
              <CardTitle className="text-xl">{article.title}</CardTitle>
            </CardHeader>
            {article.excerpt && (
              <CardContent>
                <CardDescription className="line-clamp-3">
                  {article.excerpt}
                </CardDescription>
              </CardContent>
            )}
          </Card>
        </Link>
      ))}
    </div>
  );
}

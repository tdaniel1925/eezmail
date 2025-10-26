import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { ChevronRight, FolderIcon } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
}

interface CategoryListProps {
  categories: Category[];
}

export function CategoryList({ categories }: CategoryListProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <Link key={category.id} href={`/help/category/${category.slug}`}>
          <Card className="flex items-center gap-4 p-6 transition-all hover:shadow-lg hover:border-primary/50">
            <div className="flex-shrink-0 rounded-lg bg-primary/10 p-3">
              <FolderIcon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{category.name}</h3>
              {category.description && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {category.description}
                </p>
              )}
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </Card>
        </Link>
      ))}
    </div>
  );
}

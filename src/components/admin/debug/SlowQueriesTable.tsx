'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';

interface SlowQuery {
  endpoint: string;
  method: string;
  avgDuration: number;
  maxDuration: number;
  minDuration: number;
  count: number;
  failureRate: number;
}

interface SlowQueriesTableProps {
  queries: SlowQuery[];
}

export function SlowQueriesTable({
  queries,
}: SlowQueriesTableProps): JSX.Element {
  const formatDuration = (ms: number): string => {
    if (ms >= 1000) {
      return `${(ms / 1000).toFixed(2)}s`;
    }
    return `${ms}ms`;
  };

  const getSeverityBadge = (avgDuration: number): JSX.Element => {
    if (avgDuration >= 5000) {
      return <Badge variant="destructive">Critical</Badge>;
    }
    if (avgDuration >= 3000) {
      return <Badge className="bg-orange-500">High</Badge>;
    }
    if (avgDuration >= 1000) {
      return <Badge className="bg-yellow-500">Medium</Badge>;
    }
    return <Badge variant="outline">Low</Badge>;
  };

  if (queries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No slow queries detected
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Endpoint</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Avg Duration</TableHead>
            <TableHead>Max Duration</TableHead>
            <TableHead>Count</TableHead>
            <TableHead>Failure Rate</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {queries.map((query, index) => (
            <TableRow key={index}>
              <TableCell className="font-mono text-sm">
                {query.endpoint}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{query.method}</Badge>
              </TableCell>
              <TableCell>{getSeverityBadge(query.avgDuration)}</TableCell>
              <TableCell className="font-medium">
                {formatDuration(query.avgDuration)}
              </TableCell>
              <TableCell className="text-red-600">
                {formatDuration(query.maxDuration)}
              </TableCell>
              <TableCell>{query.count.toLocaleString()}</TableCell>
              <TableCell>
                {query.failureRate > 0 ? (
                  <div className="flex items-center gap-1 text-orange-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>{query.failureRate}%</span>
                  </div>
                ) : (
                  <span className="text-green-600">0%</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

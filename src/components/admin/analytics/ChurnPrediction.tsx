'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

interface ChurnPrediction {
  userId: string;
  userEmail: string;
  churnProbability: number;
  riskLevel: string;
  contributingFactors: string[];
  lastActivityDate: string;
  engagementScore: number;
}

interface ChurnPredictionProps {
  predictions: ChurnPrediction[];
}

export function ChurnPrediction({
  predictions,
}: ChurnPredictionProps): JSX.Element {
  const getRiskBadge = (level: string): JSX.Element => {
    const variants: Record<
      string,
      'default' | 'secondary' | 'destructive' | 'outline'
    > = {
      low: 'outline',
      medium: 'secondary',
      high: 'default',
      critical: 'destructive',
    };

    const colors: Record<string, string> = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      critical: 'text-red-600',
    };

    return (
      <Badge variant={variants[level] || 'default'} className={colors[level]}>
        {level}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Churn Risk Predictions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {predictions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No churn predictions available
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Churn Probability</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Engagement Score</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Factors</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {predictions.map((prediction) => (
                  <TableRow key={prediction.userId}>
                    <TableCell className="font-medium">
                      {prediction.userEmail}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden max-w-[100px]">
                          <div
                            className="h-full bg-red-500"
                            style={{
                              width: `${prediction.churnProbability * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm">
                          {Math.round(prediction.churnProbability * 100)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getRiskBadge(prediction.riskLevel)}</TableCell>
                    <TableCell>
                      {prediction.engagementScore.toFixed(1)}
                    </TableCell>
                    <TableCell>
                      {new Date(
                        prediction.lastActivityDate
                      ).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {prediction.contributingFactors
                          .slice(0, 2)
                          .map((factor, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="text-xs"
                            >
                              {factor}
                            </Badge>
                          ))}
                        {prediction.contributingFactors.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{prediction.contributingFactors.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

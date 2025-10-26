'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
}

interface DiagnosticResult {
  success: boolean;
  tests: TestResult[];
  overall: {
    healthy: boolean;
    score: number;
    recommendations: string[];
  };
}

interface TestResultsProps {
  results: DiagnosticResult | null;
  accountId: string | null;
}

export function TestResults({
  results,
  accountId,
}: TestResultsProps): JSX.Element {
  if (!results || !accountId) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Run a test to see results
        </CardContent>
      </Card>
    );
  }

  const getHealthColor = (score: number): string => {
    if (score >= 90) return 'text-green-500';
    if (score >= 75) return 'text-blue-500';
    if (score >= 50) return 'text-orange-500';
    return 'text-red-500';
  };

  const getHealthLabel = (score: number): string => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="space-y-6">
      {/* Overall Health */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Health</CardTitle>
          <CardDescription>Account ID: {accountId}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div
                className={`text-6xl font-bold ${getHealthColor(results.overall.score)}`}
              >
                {results.overall.score}
              </div>
              <div className="text-sm text-muted-foreground text-center">
                / 100
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {results.overall.healthy ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="font-medium">
                  {getHealthLabel(results.overall.score)}
                </span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    results.overall.healthy ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${results.overall.score}%` }}
                />
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {results.overall.recommendations.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Recommendations
              </h4>
              <div className="space-y-2">
                {results.overall.recommendations.map((rec, index) => (
                  <Alert
                    key={index}
                    variant={
                      rec.toLowerCase().includes('all systems')
                        ? 'default'
                        : 'destructive'
                    }
                  >
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{rec}</AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Individual Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
          <CardDescription>
            {results.tests.filter((t) => t.passed).length} of{' '}
            {results.tests.length} tests passed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {results.tests.map((test, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg ${
                  test.passed
                    ? 'border-green-500/20 bg-green-500/5'
                    : 'border-red-500/20 bg-red-500/5'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {test.passed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <h4 className="font-medium">{test.name}</h4>
                  </div>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {test.duration}ms
                  </Badge>
                </div>
                <p
                  className={`text-sm ${
                    test.passed ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {test.message}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

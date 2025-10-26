'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  PlayCircle,
} from 'lucide-react';

interface TimelineEvent {
  timestamp: Date;
  event: string;
  details: string;
  actor: string;
  metadata?: Record<string, unknown>;
}

interface SyncJobTimelineProps {
  events: TimelineEvent[];
}

export function SyncJobTimeline({ events }: SyncJobTimelineProps): JSX.Element {
  const getEventIcon = (event: string): JSX.Element => {
    if (event.includes('start') || event === 'sync_started') {
      return <PlayCircle className="h-5 w-5 text-blue-500" />;
    }
    if (event.includes('complet') || event === 'sync_completed') {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    }
    if (event.includes('fail') || event === 'sync_failed') {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    if (event.includes('error')) {
      return <AlertCircle className="h-5 w-5 text-orange-500" />;
    }
    return <Clock className="h-5 w-5 text-muted-foreground" />;
  };

  const getEventColor = (event: string): string => {
    if (event.includes('start') || event === 'sync_started') {
      return 'border-blue-500';
    }
    if (event.includes('complet') || event === 'sync_completed') {
      return 'border-green-500';
    }
    if (event.includes('fail') || event === 'sync_failed') {
      return 'border-red-500';
    }
    if (event.includes('error')) {
      return 'border-orange-500';
    }
    return 'border-muted';
  };

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No timeline events available for this sync job.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-border" />

        {/* Events */}
        <div className="space-y-6">
          {events.map((event, index) => (
            <div key={index} className="relative flex gap-4">
              {/* Icon */}
              <div className="relative z-10 flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-background border-2 flex items-center justify-center">
                  {getEventIcon(event.event)}
                </div>
              </div>

              {/* Content */}
              <Card
                className={`flex-1 border-l-4 ${getEventColor(event.event)}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{event.event}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="outline">{event.actor}</Badge>
                  </div>

                  {event.details && event.details !== 'No details' && (
                    <div className="mt-2">
                      <pre className="text-sm bg-muted p-2 rounded overflow-x-auto">
                        {event.details}
                      </pre>
                    </div>
                  )}

                  {event.metadata && Object.keys(event.metadata).length > 0 && (
                    <div className="mt-2 space-y-1">
                      {Object.entries(event.metadata).map(([key, value]) => (
                        <div
                          key={key}
                          className="text-sm flex items-center gap-2"
                        >
                          <span className="text-muted-foreground font-medium">
                            {key}:
                          </span>
                          <span>{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

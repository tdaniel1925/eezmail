import { NextRequest, NextResponse } from 'next/server';
import { errorTracker } from '@/lib/monitoring/error-tracker';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');
    const category = searchParams.get('category');
    const resolved = searchParams.get('resolved');
    const limit = searchParams.get('limit');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const filters: any = {};
    if (level) filters.level = level;
    if (category) filters.category = category;
    if (resolved !== null) filters.resolved = resolved === 'true';
    if (limit) filters.limit = parseInt(limit);
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    const errors = errorTracker.getErrors(filters);
    const trends = errorTracker.getErrorTrends(7);
    const categoryStats = errorTracker.getCategoryStats();
    const stats = errorTracker.getStats();

    return NextResponse.json({
      success: true,
      data: {
        errors,
        trends,
        categoryStats,
        stats,
      },
    });
  } catch (error) {
    console.error('Error fetching error logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch error logs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, errorId, resolvedBy } = body;

    switch (action) {
      case 'resolve':
        if (!errorId) {
          return NextResponse.json(
            { success: false, error: 'Error ID is required' },
            { status: 400 }
          );
        }

        const resolved = errorTracker.resolveError(errorId, resolvedBy);
        if (!resolved) {
          return NextResponse.json(
            { success: false, error: 'Error not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({ success: true, message: 'Error resolved' });

      case 'log':
        const {
          level,
          category,
          message,
          stack,
          component,
          url,
          userId,
          metadata,
        } = body;
        const errorId = errorTracker.logError({
          level,
          category,
          message,
          stack,
          component,
          url,
          userId,
          metadata,
        });

        return NextResponse.json({
          success: true,
          errorId,
          message: 'Error logged successfully',
        });

      case 'export':
        const { format = 'json' } = body;
        const data = errorTracker.exportErrors(format);

        return NextResponse.json({
          success: true,
          data,
          format,
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing error monitoring request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const daysToKeep = searchParams.get('daysToKeep');

    const days = daysToKeep ? parseInt(daysToKeep) : 30;
    const removedCount = errorTracker.clearOldErrors(days);

    return NextResponse.json({
      success: true,
      message: `Cleared ${removedCount} old errors`,
      removedCount,
    });
  } catch (error) {
    console.error('Error clearing old errors:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear old errors' },
      { status: 500 }
    );
  }
}



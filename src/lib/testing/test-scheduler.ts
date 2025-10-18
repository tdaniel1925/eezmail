'use client';

import { emailFlowTester } from './email-flow-tests';
import { syncTester } from './sync-tests';
import { voiceTester } from './voice-tests';
import { errorTracker } from '@/lib/monitoring/error-tracker';

export interface TestSchedule {
  id: string;
  name: string;
  interval: number; // minutes
  lastRun?: Date;
  nextRun?: Date;
  enabled: boolean;
  tests: string[];
}

export interface TestResult {
  testSuite: string;
  timestamp: Date;
  duration: number;
  passed: boolean;
  score: number;
  results: any[];
  errors: string[];
}

export class TestScheduler {
  private schedules: TestSchedule[] = [];
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private isRunning = false;

  constructor() {
    this.loadSchedules();
    this.setupDefaultSchedules();
  }

  private loadSchedules() {
    try {
      const stored = localStorage.getItem('test-schedules');
      if (stored) {
        this.schedules = JSON.parse(stored).map((schedule: any) => ({
          ...schedule,
          lastRun: schedule.lastRun ? new Date(schedule.lastRun) : undefined,
          nextRun: schedule.nextRun ? new Date(schedule.nextRun) : undefined,
        }));
      }
    } catch (error) {
      console.error('Failed to load test schedules:', error);
    }
  }

  private saveSchedules() {
    try {
      localStorage.setItem('test-schedules', JSON.stringify(this.schedules));
    } catch (error) {
      console.error('Failed to save test schedules:', error);
    }
  }

  private setupDefaultSchedules() {
    if (this.schedules.length === 0) {
      this.schedules = [
        {
          id: 'email-tests',
          name: 'Email System Tests',
          interval: 30, // 30 minutes
          enabled: true,
          tests: ['email-flow'],
        },
        {
          id: 'sync-tests',
          name: 'Sync Performance Tests',
          interval: 60, // 1 hour
          enabled: true,
          tests: ['sync'],
        },
        {
          id: 'voice-tests',
          name: 'Voice Message Tests',
          interval: 120, // 2 hours
          enabled: true,
          tests: ['voice'],
        },
        {
          id: 'comprehensive',
          name: 'Comprehensive System Tests',
          interval: 240, // 4 hours
          enabled: true,
          tests: ['email-flow', 'sync', 'voice'],
        },
      ];
      this.saveSchedules();
    }
  }

  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.schedules.forEach((schedule) => {
      if (schedule.enabled) {
        this.scheduleTest(schedule);
      }
    });
  }

  stop() {
    this.isRunning = false;
    this.intervals.forEach((interval) => clearInterval(interval));
    this.intervals.clear();
  }

  private scheduleTest(schedule: TestSchedule) {
    if (this.intervals.has(schedule.id)) {
      clearInterval(this.intervals.get(schedule.id)!);
    }

    const interval = setInterval(
      async () => {
        try {
          await this.runScheduledTest(schedule);
        } catch (error) {
          console.error(
            `Error running scheduled test ${schedule.name}:`,
            error
          );
          errorTracker.logError({
            message: `Scheduled test failed: ${schedule.name}`,
            stack: String(error),
            component: 'TestScheduler',
            category: 'api',
            level: 'error',
          });
        }
      },
      schedule.interval * 60 * 1000
    );

    this.intervals.set(schedule.id, interval);
  }

  private async runScheduledTest(schedule: TestSchedule): Promise<TestResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let results: any[] = [];

    try {
      // Run the specified tests
      for (const testType of schedule.tests) {
        switch (testType) {
          case 'email-flow':
            const emailResults = await emailFlowTester.runAllTests();
            results.push(...emailResults);
            break;
          case 'sync':
            const syncResults = await syncTester.runAllTests();
            results.push(...syncResults);
            break;
          case 'voice':
            const voiceResults = await voiceTester.runAllTests();
            results.push(...voiceResults);
            break;
          default:
            errors.push(`Unknown test type: ${testType}`);
        }
      }

      const duration = Date.now() - startTime;
      const passedTests = results.filter((r) => r.passed).length;
      const totalTests = results.length;
      const score =
        totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
      const passed = score >= 80;

      const testResult: TestResult = {
        testSuite: schedule.name,
        timestamp: new Date(),
        duration,
        passed,
        score,
        results,
        errors,
      };

      // Update schedule
      schedule.lastRun = new Date();
      schedule.nextRun = new Date(Date.now() + schedule.interval * 60 * 1000);
      this.saveSchedules();

      // Store result
      this.storeTestResult(testResult);

      // Log critical issues
      if (!passed) {
        errorTracker.logWarning({
          message: `Scheduled test failed: ${schedule.name}`,
          component: 'TestScheduler',
          category: 'api',
          metadata: {
            score,
            totalTests,
            passedTests,
            errors: results
              .filter((r) => !r.passed)
              .map((r) => r.issues)
              .flat(),
          },
        });
      }

      return testResult;
    } catch (error) {
      const duration = Date.now() - startTime;
      const testResult: TestResult = {
        testSuite: schedule.name,
        timestamp: new Date(),
        duration,
        passed: false,
        score: 0,
        results: [],
        errors: [String(error)],
      };

      errorTracker.logError({
        message: `Scheduled test crashed: ${schedule.name}`,
        stack: String(error),
        component: 'TestScheduler',
        category: 'api',
        level: 'critical',
      });

      return testResult;
    }
  }

  private storeTestResult(result: TestResult) {
    try {
      const stored = localStorage.getItem('test-results-history');
      const history = stored ? JSON.parse(stored) : [];

      history.unshift({
        ...result,
        timestamp: result.timestamp.toISOString(),
      });

      // Keep only last 100 results
      if (history.length > 100) {
        history.splice(100);
      }

      localStorage.setItem('test-results-history', JSON.stringify(history));
    } catch (error) {
      console.error('Failed to store test result:', error);
    }
  }

  async runTestNow(scheduleId: string): Promise<TestResult | null> {
    const schedule = this.schedules.find((s) => s.id === scheduleId);
    if (!schedule) {
      throw new Error(`Schedule not found: ${scheduleId}`);
    }

    return await this.runScheduledTest(schedule);
  }

  getSchedules(): TestSchedule[] {
    return [...this.schedules];
  }

  updateSchedule(scheduleId: string, updates: Partial<TestSchedule>): boolean {
    const schedule = this.schedules.find((s) => s.id === scheduleId);
    if (!schedule) return false;

    Object.assign(schedule, updates);
    this.saveSchedules();

    if (this.isRunning && schedule.enabled) {
      this.scheduleTest(schedule);
    } else if (!schedule.enabled) {
      const interval = this.intervals.get(scheduleId);
      if (interval) {
        clearInterval(interval);
        this.intervals.delete(scheduleId);
      }
    }

    return true;
  }

  getTestHistory(limit: number = 20): TestResult[] {
    try {
      const stored = localStorage.getItem('test-results-history');
      if (!stored) return [];

      const history = JSON.parse(stored);
      return history.slice(0, limit).map((result: any) => ({
        ...result,
        timestamp: new Date(result.timestamp),
      }));
    } catch (error) {
      console.error('Failed to load test history:', error);
      return [];
    }
  }

  getTestStats() {
    const history = this.getTestHistory(50);
    const totalTests = history.length;
    const passedTests = history.filter((r) => r.passed).length;
    const averageScore =
      history.length > 0
        ? Math.round(
            history.reduce((sum, r) => sum + r.score, 0) / history.length
          )
        : 0;

    return {
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      averageScore,
      successRate:
        totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0,
    };
  }
}

// Export singleton instance
export const testScheduler = new TestScheduler();



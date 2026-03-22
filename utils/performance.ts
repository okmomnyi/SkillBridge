/**
 * Performance Monitoring Utility
 * 
 * Provides utilities for monitoring app performance including:
 * - Custom performance traces
 * - Memory usage tracking
 * - Operation timing
 * 
 * Requirements: 21.1-21.7, NFR 1.1-1.8
 */

import { Platform } from 'react-native';

interface PerformanceTrace {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, string | number>;
}

// Store active traces
const activeTraces = new Map<string, PerformanceTrace>();

// Store completed traces for analysis
const completedTraces: PerformanceTrace[] = [];

/**
 * Start a performance trace
 * 
 * @param traceName - Unique name for the trace
 * @param metadata - Optional metadata to attach to the trace
 * 
 * Requirements: NFR 1.1-1.8
 */
export function startTrace(traceName: string, metadata?: Record<string, string | number>): void {
  const trace: PerformanceTrace = {
    name: traceName,
    startTime: Date.now(),
    metadata
  };

  activeTraces.set(traceName, trace);
  console.log(`[Performance] Started trace: ${traceName}`);
}

/**
 * Stop a performance trace and log the duration
 * 
 * @param traceName - Name of the trace to stop
 * @returns Duration in milliseconds
 */
export function stopTrace(traceName: string): number | null {
  const trace = activeTraces.get(traceName);

  if (!trace) {
    console.warn(`[Performance] No active trace found: ${traceName}`);
    return null;
  }

  trace.endTime = Date.now();
  trace.duration = trace.endTime - trace.startTime;

  // Move to completed traces
  activeTraces.delete(traceName);
  completedTraces.push(trace);

  // Keep only last 100 traces
  if (completedTraces.length > 100) {
    completedTraces.shift();
  }

  console.log(`[Performance] ${traceName}: ${trace.duration}ms`, trace.metadata);

  // Log warning if operation is slow
  if (trace.duration > 1000) {
    console.warn(`[Performance] Slow operation detected: ${traceName} took ${trace.duration}ms`);
  }

  return trace.duration;
}

/**
 * Measure the execution time of an async function
 * 
 * @param name - Name for the measurement
 * @param fn - Async function to measure
 * @returns Result of the function
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  startTrace(name);
  try {
    const result = await fn();
    stopTrace(name);
    return result;
  } catch (error) {
    stopTrace(name);
    throw error;
  }
}

/**
 * Measure the execution time of a synchronous function
 * 
 * @param name - Name for the measurement
 * @param fn - Function to measure
 * @returns Result of the function
 */
export function measure<T>(name: string, fn: () => T): T {
  startTrace(name);
  try {
    const result = fn();
    stopTrace(name);
    return result;
  } catch (error) {
    stopTrace(name);
    throw error;
  }
}

/**
 * Get all completed traces
 * 
 * @returns Array of completed performance traces
 */
export function getCompletedTraces(): PerformanceTrace[] {
  return [...completedTraces];
}

/**
 * Get average duration for a specific trace name
 * 
 * @param traceName - Name of the trace to analyze
 * @returns Average duration in milliseconds or null if no traces found
 */
export function getAverageDuration(traceName: string): number | null {
  const traces = completedTraces.filter(t => t.name === traceName);

  if (traces.length === 0) {
    return null;
  }

  const totalDuration = traces.reduce((sum, t) => sum + (t.duration || 0), 0);
  return totalDuration / traces.length;
}

/**
 * Clear all completed traces
 */
export function clearTraces(): void {
  completedTraces.length = 0;
  console.log('[Performance] Cleared all traces');
}

/**
 * Log memory usage (iOS only, requires native module)
 * 
 * Requirements: 21.7
 */
export function logMemoryUsage(): void {
  if (Platform.OS === 'ios') {
    // Note: This requires a native module to get actual memory usage
    // For now, we'll just log a placeholder
    console.log('[Performance] Memory monitoring requires native module');
  } else if (Platform.OS === 'android') {
    // Android memory monitoring also requires native module
    console.log('[Performance] Memory monitoring requires native module');
  }
}

/**
 * Monitor feed load performance
 * 
 * Requirements: NFR 1.3
 */
export async function monitorFeedLoad<T>(
  fetchFn: () => Promise<T>
): Promise<T> {
  return measureAsync('feed_load', fetchFn);
}

/**
 * Monitor search performance
 * 
 * Requirements: NFR 1.4
 */
export async function monitorSearch<T>(
  searchFn: () => Promise<T>
): Promise<T> {
  return measureAsync('search', searchFn);
}

/**
 * Monitor message send performance
 * 
 * Requirements: NFR 1.5
 */
export async function monitorMessageSend<T>(
  sendFn: () => Promise<T>
): Promise<T> {
  return measureAsync('message_send', sendFn);
}

/**
 * Monitor image load performance
 * 
 * Requirements: NFR 1.6
 */
export async function monitorImageLoad<T>(
  loadFn: () => Promise<T>
): Promise<T> {
  return measureAsync('image_load', loadFn);
}

/**
 * Get performance summary
 * 
 * @returns Summary of all performance metrics
 */
export function getPerformanceSummary(): {
  totalTraces: number;
  averages: Record<string, number>;
  slowOperations: PerformanceTrace[];
} {
  const traceNames = [...new Set(completedTraces.map(t => t.name))];
  
  const averages: Record<string, number> = {};
  for (const name of traceNames) {
    const avg = getAverageDuration(name);
    if (avg !== null) {
      averages[name] = Math.round(avg);
    }
  }

  const slowOperations = completedTraces
    .filter(t => (t.duration || 0) > 1000)
    .sort((a, b) => (b.duration || 0) - (a.duration || 0))
    .slice(0, 10);

  return {
    totalTraces: completedTraces.length,
    averages,
    slowOperations
  };
}

/**
 * Log performance summary to console
 */
export function logPerformanceSummary(): void {
  const summary = getPerformanceSummary();
  
  console.log('\n=== Performance Summary ===');
  console.log(`Total traces: ${summary.totalTraces}`);
  console.log('\nAverage durations:');
  
  for (const [name, duration] of Object.entries(summary.averages)) {
    console.log(`  ${name}: ${duration}ms`);
  }
  
  if (summary.slowOperations.length > 0) {
    console.log('\nSlow operations (>1s):');
    summary.slowOperations.forEach(op => {
      console.log(`  ${op.name}: ${op.duration}ms`);
    });
  }
  
  console.log('===========================\n');
}

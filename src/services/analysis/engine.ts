import { analyzeAudio, type AnalysisInput } from './analyze';
import { AnalysisError, type AnalysisProgress, type AnalysisResult } from './types';

/**
 * The replaceable analysis interface. The UI only talks to an `AnalysisEngine`, so the
 * DSP in this module can be swapped for another library or service without UI changes.
 */
export interface AnalysisEngine {
	analyze(input: AnalysisInput, onProgress?: (progress: AnalysisProgress) => void): AnalysisJob;
}

export interface AnalysisJob {
	/** Resolves with the result, or rejects with an `AnalysisError`. */
	result: Promise<AnalysisResult>;
	/** Stops the job; `result` then rejects with code `cancelled`. */
	cancel(): void;
}

/** Messages between the page and the analysis worker. */
export type WorkerRequest = { samples: Float32Array; sampleRate: number };
export type WorkerResponse =
	| { type: 'progress'; progress: AnalysisProgress }
	| { type: 'done'; result: AnalysisResult }
	| { type: 'error'; code: AnalysisError['code']; message: string };

const cancelled = () => new AnalysisError('cancelled', 'Analysis was stopped.');

function toAnalysisError(error: unknown): AnalysisError {
	if (error instanceof AnalysisError) return error;
	return new AnalysisError(
		'failed',
		'Analysis stopped because of an unexpected error. Playback still works; try analyzing again.',
	);
}

/**
 * Runs analysis on the calling thread. Used in tests, and as a fallback where workers
 * aren't available (the page stays unresponsive while it runs).
 */
export function createInlineEngine(): AnalysisEngine {
	return {
		analyze(input, onProgress) {
			let stopped = false;
			const result = new Promise<AnalysisResult>((resolve, reject) => {
				setTimeout(() => {
					if (stopped) return reject(cancelled());
					try {
						resolve(analyzeAudio(input, onProgress ? { onProgress } : {}));
					} catch (error) {
						reject(toAnalysisError(error));
					}
				}, 0);
			});
			return {
				result,
				cancel: () => {
					stopped = true;
				},
			};
		},
	};
}

/** Runs each analysis in a new Web Worker so playback and the page stay responsive. */
export function createWorkerEngine(createWorker: () => Worker): AnalysisEngine {
	return {
		analyze(input, onProgress) {
			let worker: Worker;
			try {
				worker = createWorker();
			} catch {
				return createInlineEngine().analyze(input, onProgress);
			}
			let settle: ((error: AnalysisError) => void) | null = null;
			const result = new Promise<AnalysisResult>((resolve, reject) => {
				settle = (error) => {
					worker.terminate();
					reject(error);
				};
				worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
					const message = event.data;
					if (message.type === 'progress') {
						onProgress?.(message.progress);
						return;
					}
					worker.terminate();
					settle = null;
					if (message.type === 'done') resolve(message.result);
					else reject(new AnalysisError(message.code, message.message));
				};
				worker.onerror = (event) => {
					event.preventDefault();
					settle?.(toAnalysisError(null));
					settle = null;
				};
				// Send a copy so the song's own samples stay usable on this thread.
				const samples = input.samples.slice();
				const request: WorkerRequest = { samples, sampleRate: input.sampleRate };
				worker.postMessage(request, [samples.buffer]);
			});
			return {
				result,
				cancel: () => {
					settle?.(cancelled());
					settle = null;
				},
			};
		},
	};
}

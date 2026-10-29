/// <reference lib="webworker" />
import { analyzeAudio } from './analyze';
import type { WorkerRequest, WorkerResponse } from './engine';
import { AnalysisError } from './types';

/** Runs one analysis off the main thread and reports progress back to the page. */
const scope = self as unknown as DedicatedWorkerGlobalScope;

scope.onmessage = (event: MessageEvent<WorkerRequest>) => {
	const send = (message: WorkerResponse) => scope.postMessage(message);
	try {
		const result = analyzeAudio(event.data, {
			onProgress: (progress) => send({ type: 'progress', progress }),
		});
		send({ type: 'done', result });
	} catch (error) {
		send(
			error instanceof AnalysisError
				? { type: 'error', code: error.code, message: error.message }
				: {
						type: 'error',
						code: 'failed',
						message:
							'Analysis stopped because of an unexpected error. Playback still works; try analyzing again.',
					},
		);
	}
};

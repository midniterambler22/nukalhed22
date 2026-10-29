import { describe, expect, it, vi } from 'vitest';
import { createInlineEngine, createWorkerEngine, type WorkerResponse } from './engine';
import { AnalysisError, type AnalysisResult } from './types';

const sampleRate = 22050;
const silent = { samples: new Float32Array(sampleRate * 10), sampleRate };

const RESULT: AnalysisResult = {
	engine: 'test',
	duration: 10,
	key: null,
	tonalSections: [],
	tempo: null,
	chords: [],
	notes: [],
};

class FakeWorker {
	onmessage: ((event: MessageEvent<WorkerResponse>) => void) | null = null;
	onerror: ((event: ErrorEvent) => void) | null = null;
	posted: unknown[] = [];
	terminated = false;
	postMessage(message: unknown) {
		this.posted.push(message);
	}
	terminate() {
		this.terminated = true;
	}
	reply(message: WorkerResponse) {
		this.onmessage?.({ data: message } as MessageEvent<WorkerResponse>);
	}
}

describe('inline engine', () => {
	it('rejects with the analysis error', async () => {
		const job = createInlineEngine().analyze(silent);
		await expect(job.result).rejects.toMatchObject({ code: 'silent' });
	});

	it('can be cancelled before it starts', async () => {
		const job = createInlineEngine().analyze(silent);
		job.cancel();
		await expect(job.result).rejects.toMatchObject({ code: 'cancelled' });
	});
});

describe('worker engine', () => {
	function setup() {
		const worker = new FakeWorker();
		const engine = createWorkerEngine(() => worker as unknown as Worker);
		return { worker, engine };
	}

	it('sends a copy of the samples and relays progress and the result', async () => {
		const { worker, engine } = setup();
		const progress = vi.fn();
		const job = engine.analyze(silent, progress);
		const sent = worker.posted[0] as { samples: Float32Array; sampleRate: number };
		expect(sent.sampleRate).toBe(sampleRate);
		expect(sent.samples).not.toBe(silent.samples);
		worker.reply({ type: 'progress', progress: { stage: 'beats', fraction: 0.4 } });
		worker.reply({ type: 'done', result: RESULT });
		await expect(job.result).resolves.toBe(RESULT);
		expect(progress).toHaveBeenCalledWith({ stage: 'beats', fraction: 0.4 });
		expect(worker.terminated).toBe(true);
	});

	it('turns a worker error message into an AnalysisError', async () => {
		const { worker, engine } = setup();
		const job = engine.analyze(silent);
		worker.reply({ type: 'error', code: 'silent', message: 'No music was found' });
		await expect(job.result).rejects.toBeInstanceOf(AnalysisError);
		await expect(job.result).rejects.toMatchObject({ code: 'silent' });
	});

	it('reports a crash as a failure with a next step', async () => {
		const { worker, engine } = setup();
		const job = engine.analyze(silent);
		worker.onerror?.({ preventDefault() {} } as ErrorEvent);
		await expect(job.result).rejects.toMatchObject({
			code: 'failed',
			message: /try analyzing again/,
		});
		expect(worker.terminated).toBe(true);
	});

	it('stops the worker when cancelled', async () => {
		const { worker, engine } = setup();
		const job = engine.analyze(silent);
		job.cancel();
		await expect(job.result).rejects.toMatchObject({ code: 'cancelled' });
		expect(worker.terminated).toBe(true);
	});

	it('falls back to running inline when a worker can’t be created', async () => {
		const engine = createWorkerEngine(() => {
			throw new Error('no workers');
		});
		await expect(engine.analyze(silent).result).rejects.toMatchObject({ code: 'silent' });
	});
});

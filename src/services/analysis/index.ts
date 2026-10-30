/**
 * Analysis service: key, tempo, beat and chord estimates from decoded audio.
 * Everything runs on this device. Results are estimates with confidence, never facts.
 */
export * from './types';
export { CONFIDENCE_THRESHOLDS, confidenceLevel, toConfidence } from './confidence';
export { analyzeAudio, ENGINE_ID, MIN_ANALYSIS_SECONDS, type AnalysisInput } from './analyze';
export {
	createInlineEngine,
	createWorkerEngine,
	type AnalysisEngine,
	type AnalysisJob,
} from './engine';
export { keyName } from './key';

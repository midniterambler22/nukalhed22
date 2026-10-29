/** Formats the app accepts, in the order shown to the user. */
export type AudioFormatId = 'mp3' | 'wav' | 'm4a' | 'aac' | 'flac';

export interface AudioFormat {
	id: AudioFormatId;
	label: string;
	extensions: readonly string[];
	mimeTypes: readonly string[];
	/** MIME type passed to `canPlayType` to ask the browser whether it can decode this format. */
	probeType: string;
}

export const AUDIO_FORMATS: readonly AudioFormat[] = [
	{
		id: 'mp3',
		label: 'MP3',
		extensions: ['mp3'],
		mimeTypes: ['audio/mpeg', 'audio/mp3'],
		probeType: 'audio/mpeg',
	},
	{
		id: 'wav',
		label: 'WAV',
		extensions: ['wav', 'wave'],
		mimeTypes: ['audio/wav', 'audio/x-wav', 'audio/wave', 'audio/vnd.wave'],
		probeType: 'audio/wav',
	},
	{
		id: 'm4a',
		label: 'M4A',
		extensions: ['m4a'],
		mimeTypes: ['audio/mp4', 'audio/x-m4a', 'audio/m4a'],
		probeType: 'audio/mp4',
	},
	{
		id: 'aac',
		label: 'AAC',
		extensions: ['aac'],
		mimeTypes: ['audio/aac', 'audio/x-aac', 'audio/aacp'],
		probeType: 'audio/aac',
	},
	{
		id: 'flac',
		label: 'FLAC',
		extensions: ['flac'],
		mimeTypes: ['audio/flac', 'audio/x-flac'],
		probeType: 'audio/flac',
	},
];

/**
 * Largest file accepted: 200 MB. That fits about 19 minutes of CD-quality WAV and
 * hours of MP3, while keeping the in-browser decode for analysis within memory.
 */
export const MAX_AUDIO_FILE_BYTES = 200 * 1024 * 1024;

/** The `accept` attribute for a file input: every extension and MIME type above. */
export const AUDIO_FILE_ACCEPT = AUDIO_FORMATS.flatMap((format) => [
	...format.extensions.map((extension) => `.${extension}`),
	...format.mimeTypes,
]).join(',');

/** The parts of a `File` that validation looks at. */
export interface AudioFileInfo {
	name: string;
	size: number;
	type: string;
}

/** `HTMLMediaElement.canPlayType`: returns '' when the browser can't play the type. */
export type CanPlayType = (mimeType: string) => string;

export type AudioFileErrorCode =
	'empty-file' | 'too-large' | 'unsupported-format' | 'browser-cannot-play';

export interface AudioFileError {
	code: AudioFileErrorCode;
	message: string;
}

export type AudioFileValidation =
	{ ok: true; format: AudioFormat } | { ok: false; error: AudioFileError };

export function supportedFormatList(): string {
	const labels = AUDIO_FORMATS.map((format) => format.label);
	return `${labels.slice(0, -1).join(', ')} or ${labels[labels.length - 1]}`;
}

export function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} bytes`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
	return `${Number((bytes / (1024 * 1024)).toFixed(1))} MB`;
}

function extensionOf(name: string): string {
	const dot = name.lastIndexOf('.');
	return dot === -1 ? '' : name.slice(dot + 1).toLowerCase();
}

/**
 * Finds the format from the file extension, falling back to the MIME type when the
 * name has no known extension. Extension wins because browsers often report an empty
 * or generic type for M4A and FLAC.
 */
export function detectAudioFormat(file: Pick<AudioFileInfo, 'name' | 'type'>): AudioFormat | null {
	const extension = extensionOf(file.name);
	const byExtension = AUDIO_FORMATS.find((format) => format.extensions.includes(extension));
	if (byExtension) return byExtension;
	const mime = (file.type.toLowerCase().split(';')[0] ?? '').trim();
	return AUDIO_FORMATS.find((format) => format.mimeTypes.includes(mime)) ?? null;
}

/**
 * Checks a chosen file before anything reads it. Never throws; each failure says what
 * went wrong and what to try next.
 */
export function validateAudioFile(
	file: AudioFileInfo,
	canPlayType: CanPlayType,
): AudioFileValidation {
	if (file.size === 0) {
		return fail('empty-file', `“${file.name}” is empty (0 bytes). Choose another file.`);
	}
	if (file.size > MAX_AUDIO_FILE_BYTES) {
		return fail(
			'too-large',
			`“${file.name}” is ${formatFileSize(file.size)}. The limit is ${formatFileSize(MAX_AUDIO_FILE_BYTES)}. ` +
				'Try a compressed copy such as an MP3.',
		);
	}
	const format = detectAudioFormat(file);
	if (!format) {
		return fail(
			'unsupported-format',
			`“${file.name}” isn’t a supported audio file. Choose an ${supportedFormatList()} file.`,
		);
	}
	if (canPlayType(format.probeType) === '') {
		return fail(
			'browser-cannot-play',
			`This browser can’t play ${format.label} files. Convert the song to MP3 or WAV, or open the app in another browser.`,
		);
	}
	return { ok: true, format };
}

function fail(code: AudioFileErrorCode, message: string): AudioFileValidation {
	return { ok: false, error: { code, message } };
}

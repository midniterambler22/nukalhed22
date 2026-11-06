import { describe, expect, it } from 'vitest';
import { SCALES, isScaleId } from '../music-theory';
import { STYLE_IDS, STYLE_PROFILES, chordFunction, isStyleId, recommendForStyle } from './index';

describe('style profiles', () => {
	it('has the six blues styles Mark asked for', () => {
		expect([...STYLE_IDS].sort()).toEqual(
			['allman', 'bb-king', 'bonamassa', 'clapton', 'muddy-waters', 'srv'].sort(),
		);
		expect(STYLE_IDS.map((id) => STYLE_PROFILES[id].name).sort()).toEqual([
			'B.B. King',
			'Duane Allman',
			'Eric Clapton',
			'Joe Bonamassa',
			'Muddy Waters',
			'Stevie Ray Vaughan',
		]);
		expect(isStyleId('srv')).toBe(true);
		expect(isStyleId('hendrix')).toBe(false);
	});

	it('only uses scales in the library and always explains itself', () => {
		for (const id of STYLE_IDS) {
			const profile = STYLE_PROFILES[id];
			expect(profile.id).toBe(id);
			expect(profile.summary.length).toBeGreaterThan(20);
			for (const option of profile.options) {
				expect(isScaleId(option.scale), `${id} ${option.scale}`).toBe(true);
				expect(option.why.length).toBeGreaterThan(20);
				expect(option.sound.length).toBeGreaterThan(5);
			}
		}
	});

	it('claims no exact licks', () => {
		for (const id of STYLE_IDS) {
			const text = JSON.stringify(STYLE_PROFILES[id]).toLowerCase();
			expect(text).not.toMatch(/\bhe plays\b|\bsignature lick\b|transcri/);
		}
	});
});

describe('chord function', () => {
	it('finds the I, IV and V of a key, and anything else is other', () => {
		expect(chordFunction('A7', 'A')).toBe('I');
		expect(chordFunction('D7', 'A')).toBe('IV');
		expect(chordFunction('E7', 'A')).toBe('V');
		expect(chordFunction('F7', 'A')).toBe('other');
		expect(chordFunction('Bb7', 'F')).toBe('IV');
	});
});

describe('recommendations over a 12-bar blues in A', () => {
	it('gives every style at least one option for the I, IV and V', () => {
		for (const style of STYLE_IDS) {
			for (const chord of ['A7', 'D7', 'E7']) {
				const rec = recommendForStyle(style, 'A', chord);
				expect(rec.options.length, `${style} ${chord}`).toBeGreaterThan(0);
				expect(rec.targets.length, `${style} ${chord}`).toBeGreaterThan(0);
			}
		}
	});

	it('gives every style an option over a minor chord and a chord off the I, IV and V', () => {
		for (const style of STYLE_IDS) {
			expect(recommendForStyle(style, 'A', 'Am7').options.length, style).toBeGreaterThan(0);
			expect(recommendForStyle(style, 'A', 'F7').options.length, style).toBeGreaterThan(0);
		}
	});

	it('builds key options on the key and chord options on the chord, spelled from that root', () => {
		const rec = recommendForStyle('bb-king', 'A', 'D7');
		const key = rec.options.find((o) => o.over === 'key');
		const chord = rec.options.find((o) => o.over === 'chord');
		expect(key?.root).toBe('A');
		expect(key?.scale).toBe('minor-pentatonic');
		expect(key?.notes).toEqual(['A', 'C', 'D', 'E', 'G']);
		expect(chord?.root).toBe('D');
		expect(chord?.scale).toBe('major-pentatonic');
		expect(chord?.notes).toEqual(['D', 'E', 'F♯', 'A', 'B']);
	});

	it('gives different styles different choices over the same chord', () => {
		const names = (style: (typeof STYLE_IDS)[number]) =>
			recommendForStyle(style, 'A', 'A7').options.map(
				(o) => `${o.over}:${o.scale}:${o.register}`,
			);
		const all = STYLE_IDS.map((id) => names(id).join('|'));
		expect(new Set(all).size).toBe(STYLE_IDS.length);
		expect(recommendForStyle('srv', 'A', 'A7').options[0]?.register).toBe('low');
		expect(recommendForStyle('bb-king', 'A', 'A7').options[0]?.register).toBe('high');
	});

	it('only offers scales that contain the chord’s third or reach it in the mix', () => {
		// Mixolydian on the V chord has the chord's own notes.
		const rec = recommendForStyle('clapton', 'A', 'E7');
		const mixo = rec.options.find((o) => o.scale === 'mixolydian');
		expect(mixo?.root).toBe('E');
		expect(mixo?.notes).toEqual(['E', 'F♯', 'G♯', 'A', 'B', 'C♯', 'D']);
		expect(SCALES.mixolydian.formula).toContain('b7');
	});

	it('targets the third and seventh of a dominant chord, spelled for the chord', () => {
		const rec = recommendForStyle('clapton', 'A', 'D7');
		expect(rec.targets.map((t) => `${t.name} ${t.interval}`)).toEqual(['F♯ 3', 'C ♭7']);
		expect(rec.targets.every((t) => t.reason.length > 10)).toBe(true);
		const minor = recommendForStyle('clapton', 'A', 'Dm7');
		expect(minor.targets.map((t) => `${t.name} ${t.interval}`)).toEqual(['F ♭3', 'C ♭7']);
	});

	it('works in other keys with flats', () => {
		const rec = recommendForStyle('srv', 'Bb', 'Eb7');
		expect(rec.chordFunction).toBe('IV');
		expect(rec.options[0]?.root).toBe('B♭');
		expect(rec.options[0]?.notes).toEqual(['B♭', 'D♭', 'E♭', 'F♭', 'F', 'A♭']);
	});

	it('rejects a chord it cannot read', () => {
		expect(() => recommendForStyle('srv', 'A', 'Hm7')).toThrow();
	});
});

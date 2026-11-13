// Size and duration of each audio file, measured by scripts/audio-meta.mjs.
import meta from '../data/audio-meta.json';

export interface AudioMeta {
	bytes: number;
	seconds: number;
}

export function getAudioMeta(audioUrl: string | undefined): AudioMeta | undefined {
	return audioUrl ? (meta as Record<string, AudioMeta>)[audioUrl] : undefined;
}

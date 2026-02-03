import { useCallback, useEffect, useRef, useState } from "react";

const SOUNDS = {
	bet: "/sounds/bet-click.mp3",
	win: "/sounds/win-jackpot.mp3",
	lose: "/sounds/lose-coins.mp3",
	bg: "/sounds/bg-ambient.mp3",
} as const;

const STORAGE_KEY = "game-audio-muted";

export function useGameAudio() {
	const [isMuted, setIsMuted] = useState(() => {
		if (typeof window === "undefined") return false;
		return localStorage.getItem(STORAGE_KEY) === "true";
	});

	const audioContextRef = useRef<AudioContext | null>(null);
	const buffersRef = useRef<Map<string, AudioBuffer>>(new Map());
	const bgSourceRef = useRef<AudioBufferSourceNode | null>(null);
	const bgGainRef = useRef<GainNode | null>(null);
	const [isBgPlaying, setIsBgPlaying] = useState(false);

	// Init audio context on first user interaction
	const initContext = useCallback(() => {
		if (!audioContextRef.current) {
			audioContextRef.current = new AudioContext();
		}
		if (audioContextRef.current.state === "suspended") {
			audioContextRef.current.resume();
		}
		return audioContextRef.current;
	}, []);

	// Preload audio buffers
	useEffect(() => {
		const loadBuffers = async () => {
			const ctx = new AudioContext();
			audioContextRef.current = ctx;

			await Promise.all(
				Object.entries(SOUNDS).map(async ([key, url]) => {
					try {
						const response = await fetch(url);
						const arrayBuffer = await response.arrayBuffer();
						const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
						buffersRef.current.set(key, audioBuffer);
					} catch (e) {
						console.warn(`Failed to load ${key} sound:`, e);
					}
				}),
			);
		};

		loadBuffers();

		return () => {
			audioContextRef.current?.close();
		};
	}, []);

	// Persist mute preference
	useEffect(() => {
		localStorage.setItem(STORAGE_KEY, String(isMuted));
		if (isMuted && bgGainRef.current) {
			bgGainRef.current.gain.value = 0;
		} else if (!isMuted && bgGainRef.current) {
			bgGainRef.current.gain.value = 0.3;
		}
	}, [isMuted]);

	const playSound = useCallback(
		(name: keyof typeof SOUNDS, volume = 1) => {
			if (isMuted) return;
			const ctx = initContext();
			const buffer = buffersRef.current.get(name);
			if (!buffer) return;

			const source = ctx.createBufferSource();
			source.buffer = buffer;

			const gain = ctx.createGain();
			gain.gain.value = volume;

			source.connect(gain);
			gain.connect(ctx.destination);
			source.start(0);
		},
		[isMuted, initContext],
	);

	const playBet = useCallback(() => playSound("bet", 0.5), [playSound]);
	const playWin = useCallback(() => playSound("win", 0.7), [playSound]);
	const playLose = useCallback(() => playSound("lose", 0.5), [playSound]);

	const startBgMusic = useCallback(() => {
		const ctx = initContext();
		const buffer = buffersRef.current.get("bg");
		if (!buffer || bgSourceRef.current) return;

		const source = ctx.createBufferSource();
		source.buffer = buffer;
		source.loop = true;

		const gain = ctx.createGain();
		gain.gain.value = isMuted ? 0 : 0.3;
		bgGainRef.current = gain;

		source.connect(gain);
		gain.connect(ctx.destination);
		source.start(0);

		bgSourceRef.current = source;
		setIsBgPlaying(true);
	}, [initContext, isMuted]);

	const stopBgMusic = useCallback(() => {
		if (bgSourceRef.current) {
			bgSourceRef.current.stop();
			bgSourceRef.current = null;
			bgGainRef.current = null;
			setIsBgPlaying(false);
		}
	}, []);

	const toggleMute = useCallback(() => {
		setIsMuted((m) => !m);
	}, []);

	return {
		playBet,
		playWin,
		playLose,
		startBgMusic,
		stopBgMusic,
		toggleMute,
		isMuted,
		isBgPlaying,
	};
}

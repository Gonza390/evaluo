"""Voz de trabajo en español argentino y música original para el video."""
import asyncio
import json
import math
import struct
import sys
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'tmp' / 'video-tools'))
import edge_tts

DEST = ROOT / 'public' / 'video' / 'study-loop'

async def main():
    scenes = json.loads((ROOT / 'video' / 'study-loop-script.json').read_text(encoding='utf-8'))
    for i, scene in enumerate(scenes):
        await edge_tts.Communicate(scene['voice'], 'es-AR-ElenaNeural', rate='+12%').save(str(DEST / f'voice-{i}.mp3'))
        print(f'Voz {i + 1}/{len(scenes)} lista', flush=True)
    # Cama musical sintetizada: acordes suaves, pulso y transitorios. Sin muestras externas.
    sr = 24000
    chords = [(130.81, 164.81, 196), (110, 130.81, 164.81), (87.31, 110, 130.81), (98, 123.47, 146.83)]
    with wave.open(str(DEST / 'music.wav'), 'wb') as audio:
        audio.setnchannels(1)
        audio.setsampwidth(2)
        audio.setframerate(sr)
        for second in range(90):
            data = bytearray()
            for sample in range(sr):
                t = second + sample / sr
                chord = chords[int(t / 4) % 4]
                beat = t % 0.5
                pad = sum(math.sin(2 * math.pi * hz * t) for hz in chord) * 0.07
                kick = math.sin(2 * math.pi * (52 * beat + 22 * (1 - math.exp(-beat * 30)) / 30)) * math.exp(-beat * 25) * 0.22
                pluck = math.sin(2 * math.pi * chord[int(t * 2) % 3] * 4 * t) * math.exp(-beat * 12) * 0.08
                fade = min(1, t / 2, (90 - t) / 3)
                data.extend(struct.pack('<h', int((pad + kick + pluck) * fade * 24000)))
            audio.writeframes(data)

asyncio.run(main())

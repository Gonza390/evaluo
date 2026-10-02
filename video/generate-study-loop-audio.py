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
asyncio.run(main())

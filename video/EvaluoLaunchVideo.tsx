import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';

export const EvaluoLaunchVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0b1020',
        color: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div
        style={{
          opacity,
          textAlign: 'center',
          padding: 80,
        }}
      >
        <div style={{fontSize: 108, fontWeight: 800, letterSpacing: -4}}>Evaluo</div>
        <div style={{fontSize: 38, marginTop: 24, opacity: 0.72}}>
          Base de video lista para editar
        </div>
      </div>
    </AbsoluteFill>
  );
};

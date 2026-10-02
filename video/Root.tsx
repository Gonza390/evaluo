import React from 'react';
import { Composition } from 'remotion';
import { EvaluoPdfVideoPolished } from './EvaluoPdfVideoPolished';
import { EvaluoComfyDemo } from './EvaluoComfyDemo';
import { EvaluoStudyLoop } from './EvaluoStudyLoop';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="EvaluoStudyLoop"
        component={EvaluoStudyLoop}
        durationInFrames={2700}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="EvaluoComfyDemo"
        component={EvaluoComfyDemo}
        durationInFrames={540}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="EvaluoLaunchVideo"
        component={EvaluoPdfVideoPolished}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};

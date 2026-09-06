import React from 'react';
import {Composition} from 'remotion';
import {EvaluoLaunchVideo} from './EvaluoLaunchVideo';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="EvaluoLaunchVideo"
      component={EvaluoLaunchVideo}
      durationInFrames={450}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};

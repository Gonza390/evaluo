import React from 'react';
import {Composition} from 'remotion';
import {EvaluoPdfVideo} from './EvaluoPdfVideo';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="EvaluoLaunchVideo"
      component={EvaluoPdfVideo}
      durationInFrames={900}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};

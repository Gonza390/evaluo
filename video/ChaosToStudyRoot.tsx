import React from 'react';
import {Composition} from 'remotion';
import {EvaluoChaosToStudy} from './EvaluoChaosToStudy';

export const ChaosToStudyRoot: React.FC = () => (
  <Composition
    id="EvaluoChaosToStudy"
    component={EvaluoChaosToStudy}
    durationInFrames={900}
    fps={30}
    width={1920}
    height={1080}
  />
);

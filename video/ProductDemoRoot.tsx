import React from 'react';
import {Composition} from 'remotion';
import {EvaluoProductDemo} from './EvaluoProductDemo';

export const ProductDemoRoot: React.FC = () => {
  return (
    <Composition
      id="EvaluoProductDemo"
      component={EvaluoProductDemo}
      durationInFrames={600}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};

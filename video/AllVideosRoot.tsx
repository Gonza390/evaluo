import React from 'react';
import {RemotionRoot} from './Root';
import {ProductDemoRoot} from './ProductDemoRoot';
import {ChaosToStudyRoot} from './ChaosToStudyRoot';

export const AllVideosRoot: React.FC = () => (
  <>
    <RemotionRoot />
    <ProductDemoRoot />
    <ChaosToStudyRoot />
  </>
);

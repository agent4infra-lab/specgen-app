import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { Explainer } from './Explainer';
const Root = () => React.createElement(Composition, { id: 'SpecGen', component: Explainer, durationInFrames: 1800, fps: 30, width: 1920, height: 1080 });
registerRoot(Root);

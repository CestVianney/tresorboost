import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from './sepolia';

export const config = getDefaultConfig({
  appName: 'TresorBoost',
  projectId: '6Bb33867C1f51ccE93C9882dF01FAB32a209Fb76',
  chains: [
    sepolia,
  ],
  ssr: true,
});

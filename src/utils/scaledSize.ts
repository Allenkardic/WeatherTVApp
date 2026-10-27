import { Dimensions, PixelRatio } from 'react-native';

const DESIGN_WIDTH = 1920;

const { width, height } = Dimensions.get('window');
const longSide = Math.max(width, height); // defensive; TV is always landscape
const scale = longSide / DESIGN_WIDTH;

export const scaledSize = (size: number) =>
  PixelRatio.roundToNearestPixel(size * scale);

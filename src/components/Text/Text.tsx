import {
  Text as RNText,
  type ColorValue,
  type TextProps as RNTextProps,
  type TextStyle,
} from 'react-native';
import { colors, fontSize } from '../../utils';

export type TextVariant = keyof typeof fontSize;

export type TextProps = RNTextProps & {
  variant?: TextVariant;
  color?: ColorValue;
  fontWeight?: TextStyle['fontWeight'];
};

export function Text({
  variant = 'body',
  color = colors.black,
  fontWeight = '400',
  allowFontScaling = false,
  style,
  ...rest
}: TextProps) {
  return (
    <RNText
      allowFontScaling={allowFontScaling}
      style={[{ color, fontSize: fontSize[variant], fontWeight }, style]}
      {...rest}
    />
  );
}

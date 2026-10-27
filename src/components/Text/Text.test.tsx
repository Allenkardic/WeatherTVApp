import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { StyleSheet, Text as RNText } from 'react-native';
import { Text } from './Text';
import { colors, fontSize } from '../../utils';

async function renderText(element: React.ReactElement) {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(element);
  });
  return renderer;
}

function textProps(renderer: ReactTestRenderer.ReactTestRenderer) {
  return renderer.root.findByType(RNText).props;
}

test('renders children with the body size, black color, and regular weight', async () => {
  const renderer = await renderText(<Text>Hello</Text>);
  const props = textProps(renderer);

  expect(props.children).toBe('Hello');
  expect(props.allowFontScaling).toBe(false);
  expect(StyleSheet.flatten(props.style)).toMatchObject({
    color: colors.black,
    fontSize: fontSize.body,
    fontWeight: '400',
  });
});

test('applies the requested size, color, and weight', async () => {
  const renderer = await renderText(
    <Text variant="headline" color={colors.gold} fontWeight="700">
      Title
    </Text>,
  );

  expect(StyleSheet.flatten(textProps(renderer).style)).toMatchObject({
    color: colors.gold,
    fontSize: fontSize.headline,
    fontWeight: '700',
  });
});

test('lets style and text props override the defaults', async () => {
  const renderer = await renderText(
    <Text
      allowFontScaling
      numberOfLines={1}
      testID="caption"
      style={{ color: colors.white, fontSize: 12, fontWeight: '300' }}
    >
      Caption
    </Text>,
  );
  const props = textProps(renderer);

  expect(props.allowFontScaling).toBe(true);
  expect(props.numberOfLines).toBe(1);
  expect(props.testID).toBe('caption');
  expect(StyleSheet.flatten(props.style)).toMatchObject({
    color: colors.white,
    fontSize: 12,
    fontWeight: '300',
  });
});

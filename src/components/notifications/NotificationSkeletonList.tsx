import React, { memo, useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { BorderRadius, Spacing } from '../../theme';

const PLACEHOLDERS = [1, 2, 3, 4, 5, 6];

function SkeletonListBody() {
  const { colors } = useTheme();
  const shimmer = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0.45,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [shimmer]);

  return (
    <View style={styles.container}>
      {PLACEHOLDERS.map((key) => (
        <Animated.View
          key={key}
          style={[
            styles.row,
            {
              opacity: shimmer,
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={[styles.avatar, { backgroundColor: colors.skeleton }]} />
          <View style={styles.content}>
            <View style={[styles.lineLarge, { backgroundColor: colors.skeleton }]} />
            <View style={[styles.lineSmall, { backgroundColor: colors.skeleton }]} />
          </View>
          <View style={[styles.thumb, { backgroundColor: colors.skeleton }]} />
        </Animated.View>
      ))}
    </View>
  );
}

export const NotificationSkeletonList = memo(SkeletonListBody);

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
    paddingTop: Spacing.base,
  },
  row: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  content: {
    flex: 1,
    gap: 8,
  },
  lineLarge: {
    height: 11,
    borderRadius: 8,
    width: '92%',
  },
  lineSmall: {
    height: 9,
    borderRadius: 8,
    width: '40%',
  },
  thumb: {
    width: 42,
    height: 42,
    borderRadius: 10,
  },
});

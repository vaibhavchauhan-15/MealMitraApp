import React, { memo, useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useTheme } from '../../theme/useTheme';
import { BorderRadius, Shadow, Spacing, Typography } from '../../theme';
import { useInteractionNotificationStore } from '../../store/interactionNotificationStore';
import { useUserStore } from '../../store/userStore';

const HIDDEN_PREFIXES = ['/notifications', '/(onboarding)', '/index'];

function shouldHideBell(pathname: string): boolean {
  if (!pathname) return true;
  return HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function BellBody() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const unreadCount = useInteractionNotificationStore((s) => s.unreadCount);
  const incomingSequence = useInteractionNotificationStore((s) => s.incomingSequence);
  const profileId = useUserStore((s) => s.profile?.id);

  const prevUnreadRef = useRef(unreadCount);
  const badgeScale = useRef(new Animated.Value(unreadCount > 0 ? 1 : 0)).current;
  const badgeOpacity = useRef(new Animated.Value(unreadCount > 0 ? 1 : 0)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const previous = prevUnreadRef.current;
    const increased = unreadCount > previous;
    const becameZero = unreadCount === 0 && previous > 0;

    if (increased) {
      badgeOpacity.setValue(1);
      Animated.sequence([
        Animated.spring(badgeScale, {
          toValue: 1.35,
          useNativeDriver: true,
          friction: 4,
          tension: 160,
        }),
        Animated.spring(badgeScale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 5,
          tension: 140,
        }),
      ]).start();
    }

    if (becameZero) {
      Animated.parallel([
        Animated.timing(badgeOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(badgeScale, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (unreadCount > 0 && previous === 0) {
      badgeScale.setValue(0.7);
      badgeOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(badgeScale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 6,
          tension: 130,
        }),
        Animated.timing(badgeOpacity, {
          toValue: 1,
          duration: 140,
          useNativeDriver: true,
        }),
      ]).start();
    }

    prevUnreadRef.current = unreadCount;
  }, [unreadCount, badgeScale, badgeOpacity]);

  useEffect(() => {
    if (incomingSequence <= 0 || unreadCount <= 0) return;
    pulseScale.setValue(1);
    pulseOpacity.setValue(0.35);

    Animated.parallel([
      Animated.timing(pulseScale, {
        toValue: 2.2,
        duration: 520,
        useNativeDriver: true,
      }),
      Animated.timing(pulseOpacity, {
        toValue: 0,
        duration: 520,
        useNativeDriver: true,
      }),
    ]).start();
  }, [incomingSequence, unreadCount, pulseScale, pulseOpacity]);

  if (!profileId || shouldHideBell(pathname)) {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFillObject}>
      <View style={[styles.wrap, { top: insets.top + 8, right: Spacing.base }]}> 
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push('/notifications' as any)}
          style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.border }, Shadow.sm]}
        >
          <Ionicons name="notifications-outline" size={21} color={colors.text} />

          <Animated.View
            pointerEvents="none"
            style={[
              styles.pulse,
              { backgroundColor: colors.error, opacity: pulseOpacity, transform: [{ scale: pulseScale }] },
            ]}
          />

          {unreadCount > 0 ? (
            <Animated.View
              style={[
                styles.badge,
                {
                  backgroundColor: colors.error,
                  opacity: badgeOpacity,
                  transform: [{ scale: badgeScale }],
                },
              ]}
            >
              <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </Animated.View>
          ) : null}
        </TouchableOpacity>
      </View>
    </View>
  );
}

export const GlobalNotificationBell = memo(BellBody);

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    zIndex: 1200,
  },
  button: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  badge: {
    position: 'absolute',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    top: -5,
    right: -5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.xs,
    fontWeight: '800',
    lineHeight: 12,
  },
  pulse: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

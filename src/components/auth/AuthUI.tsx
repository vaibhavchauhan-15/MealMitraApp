import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius, Spacing, Typography } from '../../theme';

export function AuthAnimatedView({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 240,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, opacity, translateY]);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

export function AuthHeader({
  title,
  topInset,
  borderColor,
  textColor,
  onBack,
}: {
  title: string;
  topInset: number;
  borderColor: string;
  textColor: string;
  onBack: () => void;
}) {
  return (
    <View style={[styles.header, { paddingTop: topInset + 8, borderBottomColor: borderColor }]}>
      <TouchableOpacity onPress={onBack}>
        <Ionicons name="arrow-back" size={24} color={textColor} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: textColor }]}>{title}</Text>
      <View style={{ width: 24 }} />
    </View>
  );
}

export function AuthCard({
  children,
  backgroundColor,
  borderColor,
  style,
}: {
  children: React.ReactNode;
  backgroundColor: string;
  borderColor: string;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, { backgroundColor, borderColor }, style]}>{children}</View>;
}

export function AuthFieldLabel({
  text,
  color,
  style,
}: {
  text: string;
  color: string;
  style?: StyleProp<TextStyle>;
}) {
  return <Text style={[styles.fieldLabel, { color }, style]}>{text}</Text>;
}

export function AuthInputContainer({
  children,
  backgroundColor,
  borderColor,
  style,
}: {
  children: React.ReactNode;
  backgroundColor: string;
  borderColor?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.inputContainer, { backgroundColor, borderColor: borderColor ?? 'transparent' }, borderColor ? styles.inputContainerBordered : null, style]}>
      {children}
    </View>
  );
}

export function AuthInfoBox({
  children,
  iconColor,
  backgroundColor,
  borderColor,
  textColor,
  style,
}: {
  children: React.ReactNode;
  iconColor: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.infoBox, { backgroundColor, borderColor }, style]}>
      <Ionicons name="information-circle-outline" size={16} color={iconColor} />
      <Text style={[styles.infoText, { color: textColor }]}>{children}</Text>
    </View>
  );
}

export function AuthActionButton({
  label,
  onPress,
  loading,
  disabled,
  variant,
  color,
  textColor,
  borderColor,
  style,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant: 'primary' | 'outline';
  color: string;
  textColor: string;
  borderColor?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.actionBtn,
        variant === 'primary'
          ? { backgroundColor: color }
          : { backgroundColor: 'transparent', borderColor: borderColor ?? color, borderWidth: 1 },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'primary' ? '#FFF' : color} />
      ) : (
        <Text style={[styles.actionBtnText, { color: textColor }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

export function AuthModeSwitch({
  value,
  options,
  onChange,
  accentColor,
  textColor,
  mutedTextColor,
  backgroundColor,
  style,
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  accentColor: string;
  textColor: string;
  mutedTextColor: string;
  backgroundColor: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.modeSwitch, { backgroundColor }, style]}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.modeButton, active && { backgroundColor: accentColor }]}
            onPress={() => onChange(option.value)}
          >
            <Text style={[styles.modeButtonText, { color: active ? '#FFF' : mutedTextColor }]}>{option.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
  },
  card: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  fieldLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  inputContainer: {
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainerBordered: {
    borderWidth: 1,
  },
  infoBox: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    lineHeight: 18,
  },
  actionBtn: {
    height: 50,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '700',
  },
  modeSwitch: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    padding: 4,
    gap: 4,
  },
  modeButton: {
    flex: 1,
    borderRadius: BorderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  modeButtonText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    textAlign: 'center',
  },
});

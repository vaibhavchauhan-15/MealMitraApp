import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
  icon?: string;
  iconColor?: string;
  hideCancelButton?: boolean;
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
  icon,
  iconColor,
  hideCancelButton = false,
}: ConfirmModalProps) {
  const { colors } = useTheme();

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
          <TouchableWithoutFeedback>
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              {icon && (
                <View
                  style={[
                    styles.iconWrap,
                    { backgroundColor: (iconColor ?? colors.accent) + '20' },
                  ]}
                >
                  <Ionicons
                    name={icon as any}
                    size={30}
                    color={iconColor ?? colors.accent}
                  />
                </View>
              )}

              <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
              <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>

              <View style={[styles.actions, !hideCancelButton && onCancel && styles.actionsRow]}>
                {!hideCancelButton && onCancel && (
                  <TouchableOpacity
                    style={[
                      styles.btn,
                      styles.cancelBtn,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={onCancel}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.btnText, { color: colors.textSecondary }]}>
                      {cancelText}
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[
                    styles.btn,
                    styles.confirmBtn,
                    hideCancelButton && styles.singleActionBtn,
                    {
                      backgroundColor: destructive ? colors.error : colors.accent,
                      borderColor: destructive ? colors.error : colors.accent,
                    },
                  ]}
                  onPress={onConfirm}
                  activeOpacity={0.8}
                >
                  <Text style={styles.confirmBtnText}>{confirmText}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingTop: 28,
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 14,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },
  actions: {
    alignSelf: 'stretch',
    paddingTop: 18,
    width: '100%',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  cancelBtn: {},
  confirmBtn: {},
  singleActionBtn: {
    width: '100%',
  },
  btnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

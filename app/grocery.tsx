import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/theme/useTheme';
import { Spacing, Typography, BorderRadius } from '../src/theme';
import { useGroceryStore } from '../src/store/groceryStore';

export default function GroceryScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { items, toggleItem, removeItem, clearChecked, clearAll, addCustomItem } =
    useGroceryStore();
  const [customName, setCustomName] = useState('');
  const [customQty, setCustomQty] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  const handleAddCustom = () => {
    if (!customName.trim()) return;
    addCustomItem(customName.trim(), parseFloat(customQty.trim()) || 1, 'piece');
    setCustomName('');
    setCustomQty('');
    setShowAdd(false);
  };

  const renderItem = ({ item }: { item: (typeof items)[0] }) => (
    <TouchableOpacity
      style={[
        styles.row,
        { backgroundColor: colors.surface, borderColor: colors.border },
        item.checked && { opacity: 0.5 },
      ]}
      onPress={() => toggleItem(item.id)}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.checkbox,
          { borderColor: colors.accent },
          item.checked && { backgroundColor: colors.accent },
        ]}
      >
        {item.checked && <Ionicons name="checkmark" size={14} color="#fff" />}
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={[
            styles.itemName,
            { color: colors.text },
            item.checked && styles.strikethrough,
          ]}
        >
          {item.name}
        </Text>
        <Text style={[styles.itemQty, { color: colors.textSecondary }]}>
          {item.quantity} {item.unit}
        </Text>
      </View>
      <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.deleteBtn}>
        <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Grocery List</Text>
        <TouchableOpacity onPress={() => setShowAdd((p) => !p)}>
          <Ionicons name="add-circle-outline" size={28} color={colors.accent} />
        </TouchableOpacity>
      </View>

      {/* Add Custom Item */}
      {showAdd && (
        <View style={[styles.addRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            style={[styles.addInput, { color: colors.text, borderColor: colors.border, flex: 2 }]}
            placeholder="Item name"
            placeholderTextColor={colors.textSecondary}
            value={customName}
            onChangeText={setCustomName}
          />
          <TextInput
            style={[styles.addInput, { color: colors.text, borderColor: colors.border, flex: 1 }]}
            placeholder="Qty"
            placeholderTextColor={colors.textSecondary}
            value={customQty}
            onChangeText={setCustomQty}
            keyboardType="numeric"
          />
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.accent }]}
            onPress={handleAddCustom}
          >
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      )}

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Grocery list is empty</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Add meals to your planner to auto-populate this list
          </Text>
        </View>
      ) : (
        <FlatList
          data={[...unchecked, ...checked]}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.summary}>
              <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
                {unchecked.length} items remaining · {checked.length} done
              </Text>
            </View>
          }
          ListFooterComponent={
            checked.length > 0 ? (
              <TouchableOpacity
                style={[styles.clearBtn, { borderColor: colors.border }]}
                onPress={clearChecked}
              >
                <Ionicons name="checkmark-done-outline" size={18} color={colors.textSecondary} />
                <Text style={[styles.clearText, { color: colors.textSecondary }]}>
                  Clear checked ({checked.length})
                </Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}

      {/* Clear All FAB */}
      {items.length > 0 && (
        <TouchableOpacity
          style={[styles.clearAll, { backgroundColor: '#E53935', bottom: insets.bottom + Spacing.base }]}
          onPress={clearAll}
        >
          <Ionicons name="trash-outline" size={20} color="#fff" />
          <Text style={styles.clearAllText}>Clear All</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: { marginRight: Spacing.sm },
  title: { flex: 1, fontSize: Typography.fontSize.xl, fontWeight: '800' },
  addRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.base,
    borderBottomWidth: 1,
  },
  addInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.fontSize.base,
  },
  addBtn: {
    height: 40,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: Typography.fontSize.base },
  list: { padding: Spacing.base, gap: Spacing.sm, paddingBottom: 100 },
  summary: { marginBottom: Spacing.sm },
  summaryText: { fontSize: Typography.fontSize.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: { fontWeight: '600', fontSize: Typography.fontSize.base },
  itemQty: { fontSize: Typography.fontSize.sm, marginTop: 2 },
  strikethrough: { textDecorationLine: 'line-through' },
  deleteBtn: { padding: 4 },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  clearText: { fontWeight: '600', fontSize: Typography.fontSize.base },
  clearAll: {
    position: 'absolute',
    right: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  clearAllText: { color: '#fff', fontWeight: '700', fontSize: Typography.fontSize.base },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  emptyEmoji: { fontSize: 60 },
  emptyTitle: { fontSize: Typography.fontSize.xl, fontWeight: '800' },
  emptySubtitle: { fontSize: Typography.fontSize.base, textAlign: 'center', paddingHorizontal: Spacing['2xl'] },
});

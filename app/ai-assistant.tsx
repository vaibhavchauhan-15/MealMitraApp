import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/theme/useTheme';
import { Spacing, Typography, BorderRadius } from '../src/theme';
import { useRecipeStore } from '../src/store/recipeStore';

type Message = {
  id: string;
  role: 'user' | 'bot';
  text: string;
};

const SUGGESTIONS = [
  'What can I cook with paneer?',
  'Suggest a quick breakfast',
  'Give me a high-protein recipe',
  'What is a vegan Indian dish?',
  'How do I make masala chai?',
  'Healthy lunch ideas under 400 kcal',
];

export default function AIAssistantScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const allRecipes = useRecipeStore((s) => s.recipes);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'bot',
      text: "👋 Hi! I'm MealMitra AI. Ask me anything about Indian recipes, ingredients, nutrition, or cooking tips!",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList>(null);

  const generateResponse = (query: string): string => {
    const q = query.toLowerCase();

    // Ingredient-based
    const ingredientMatch = allRecipes.filter((r) =>
      r.ingredients.some((i) => q.includes(i.name.toLowerCase()))
    );
    if (ingredientMatch.length > 0 && q.includes('cook')) {
      return `You can cook ${ingredientMatch
        .slice(0, 3)
        .map((r) => r.name)
        .join(', ')} with those ingredients! 🍽️`;
    }

    // Quick/breakfast/lunch/dinner
    if (q.includes('quick') || q.includes('fast')) {
      const quick = allRecipes.filter((r) => r.cook_time <= 20).slice(0, 3);
      return quick.length
        ? `Quick recipes (under 20 min): ${quick.map((r) => r.name).join(', ')} ⚡`
        : 'Try Masala Chai or Chana Chaat — both are under 15 minutes!';
    }
    if (q.includes('breakfast')) {
      const b = allRecipes.filter((r) => r.tags.some((t) => t.toLowerCase().includes('breakfast'))).slice(0, 3);
      return b.length
        ? `Breakfast ideas: ${b.map((r) => r.name).join(', ')} ☀️`
        : 'Great breakfasts: Masala Dosa, Idli Sambar, Aloo Paratha';
    }
    if (q.includes('lunch') || q.includes('dinner')) {
      const l = allRecipes.filter((r) => r.cook_time >= 20 && r.cook_time <= 45).slice(0, 3);
      return `Try: ${l.map((r) => r.name).join(', ')} 🍛`;
    }

    // Diet-based
    if (q.includes('vegan')) {
      const v = allRecipes.filter((r) => r.diet === 'Vegan').slice(0, 3);
      return v.length
        ? `Vegan options: ${v.map((r) => r.name).join(', ')} 🌱`
        : 'Most Indian dal and vegetable dishes can be made vegan!';
    }
    if (q.includes('vegetarian') || q.includes('veg')) {
      const v = allRecipes.filter((r) => r.diet === 'Vegetarian' || r.diet === 'Vegan').slice(0, 4);
      return `Vegetarian dishes: ${v.map((r) => r.name).join(', ')} 🥗`;
    }
    if (q.includes('protein') || q.includes('high protein')) {
      const p = allRecipes
        .filter((r) => r.nutrition.protein >= 15)
        .sort((a, b) => b.nutrition.protein - a.nutrition.protein)
        .slice(0, 3);
      return p.length
        ? `High-protein picks: ${p.map((r) => `${r.name} (${r.nutrition.protein}g protein)`).join(', ')} 💪`
        : 'Dal Makhani, Butter Chicken, and Rajma Chawal are great protein sources!';
    }

    // Calorie
    const calorieMatch = q.match(/(\d+)\s*kcal/);
    if (calorieMatch) {
      const max = parseInt(calorieMatch[1]);
      const low = allRecipes.filter((r) => r.calories <= max).slice(0, 3);
      return low.length
        ? `Under ${max} kcal: ${low.map((r) => `${r.name} (${r.calories} kcal)`).join(', ')}`
        : "Try Masala Chai (120 kcal) or Chana Chaat (280 kcal) for light options.";
    }

    // Specific recipe
    for (const recipe of allRecipes) {
      if (q.includes(recipe.name.toLowerCase())) {
        return `${recipe.name}: ${recipe.description} It takes ${recipe.cook_time} minutes and has ${recipe.calories} kcal. Difficulty: ${recipe.difficulty}. 🍽️`;
      }
    }

    // Cuisine
    const cuisines = ['south indian', 'north indian', 'punjabi', 'street food', 'bengali', 'mughlai'];
    for (const c of cuisines) {
      if (q.includes(c)) {
        const cr = allRecipes.filter((r) => r.cuisine.toLowerCase().includes(c)).slice(0, 3);
        if (cr.length) return `${c.charAt(0).toUpperCase() + c.slice(1)} dishes: ${cr.map((r) => r.name).join(', ')} 🌶️`;
      }
    }

    // Tips
    if (q.includes('tip') || q.includes('trick')) {
      return '👨‍🍳 Pro tips:\n• Always bloom whole spices in hot oil\n• Let onions caramelize fully for depth\n• Add salt in layers while cooking\n• Rest curries for 10 min before serving';
    }

    // Default fallback
    const random = allRecipes[Math.floor(Math.random() * allRecipes.length)];
    return `Here's a recipe recommendation: **${random.name}** — ${random.description} (${random.cook_time} min, ${random.calories} kcal) 🍛`;
  };

  const sendMessage = (text: string) => {
    const q = text.trim();
    if (!q) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: q };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    setTimeout(() => {
      const botReply = generateResponse(q);
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'bot', text: botReply },
      ]);
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }, 600);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <View style={[styles.aiBadge, { backgroundColor: colors.accent }]}>
            <Text style={styles.aiBadgeText}>AI</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>MealMitra AI</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : null]}>
            {item.role === 'bot' && (
              <View style={[styles.botAvatar, { backgroundColor: colors.accent }]}>
                <Text style={styles.botAvatarText}>🤖</Text>
              </View>
            )}
            <View
              style={[
                styles.bubbleContent,
                item.role === 'user'
                  ? { backgroundColor: colors.accent }
                  : { backgroundColor: colors.surface },
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  { color: item.role === 'user' ? '#FFF' : colors.text },
                ]}
              >
                {item.text}
              </Text>
            </View>
          </View>
        )}
        contentContainerStyle={styles.messages}
        onContentSizeChange={() => listRef.current?.scrollToEnd()}
        ListFooterComponent={
          loading ? (
            <View style={[styles.bubble]}>
              <View style={[styles.botAvatar, { backgroundColor: colors.accent }]}>
                <Text style={styles.botAvatarText}>🤖</Text>
              </View>
              <View style={[styles.bubbleContent, { backgroundColor: colors.surface }]}>
                <Text style={{ color: colors.textSecondary, letterSpacing: 3 }}>...</Text>
              </View>
            </View>
          ) : null
        }
      />

      {/* Suggestion Chips */}
      {messages.length <= 1 && (
        <View style={styles.suggestionsWrapper}>
          <FlatList
            horizontal
            data={SUGGESTIONS}
            keyExtractor={(s) => s}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.suggestion, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => sendMessage(item)}
              >
                <Text style={[styles.suggestionText, { color: colors.text }]}>{item}</Text>
              </TouchableOpacity>
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: Spacing.sm, paddingHorizontal: Spacing.base }}
          />
        </View>
      )}

      {/* Input */}
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + Spacing.sm,
          },
        ]}
      >
        <TextInput
          style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
          placeholder="Ask about recipes, nutrition, tips..."
          placeholderTextColor={colors.textSecondary}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => sendMessage(input)}
          returnKeyType="send"
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: input.trim() ? colors.accent : colors.surface }]}
          onPress={() => sendMessage(input)}
          disabled={!input.trim()}
        >
          <Ionicons name="send" size={20} color={input.trim() ? '#FFF' : colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  headerTitle: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, justifyContent: 'center' },
  aiBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBadgeText: { color: '#FFF', fontWeight: '900', fontSize: 12 },
  title: { fontSize: Typography.fontSize.xl, fontWeight: '800' },
  messages: { padding: Spacing.base, gap: Spacing.md, paddingBottom: Spacing.xl },
  bubble: { flexDirection: 'row', gap: Spacing.sm },
  userBubble: { flexDirection: 'row-reverse' },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 4,
  },
  botAvatarText: { fontSize: 16 },
  bubbleContent: {
    maxWidth: '80%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  bubbleText: { fontSize: Typography.fontSize.base, lineHeight: 22 },
  suggestionsWrapper: { marginBottom: Spacing.sm },
  suggestion: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  suggestionText: { fontSize: Typography.fontSize.sm },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 100,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.base,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

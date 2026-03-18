import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Share,
  Dimensions,
  ActivityIndicator,
  Modal,
  TextInput,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/useTheme';
import { Spacing, Typography, BorderRadius, Shadow } from '../../src/theme';
import { useRecipeStore } from '../../src/store/recipeStore';
import { useSavedStore } from '../../src/store/savedStore';
import { usePlannerStore } from '../../src/store/plannerStore';
import { useUserStore } from '../../src/store/userStore';
import { NutritionBadge } from '../../src/components/NutritionBadge';
import { RecipeCard } from '../../src/components/RecipeCard';
import { FallbackImage } from '../../src/components/FallbackImage';
import { DayOfWeek, MealType, Recipe } from '../../src/types';
import {
  addRecipeComment,
  deleteRecipeComment,
  getRecipeComments,
  getRecipeSocialSnapshot,
  RecipeCommentItem,
  toggleCommentLike,
  toggleRecipeReaction,
  updateRecipeComment,
} from '../../src/services/recipeSocialService';
import { supabase } from '../../src/services/supabase';

const { width } = Dimensions.get('window');
const IMAGE_HEIGHT = 280;

const DAYS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MEALS: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export default function RecipeDetailScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id, source } = useLocalSearchParams<{ id: string; source?: string }>();
  const routeSource: 'master' | 'ai' = source === 'ai' ? 'ai' : 'master';
  const { fetchById, fetchSimilar, addRecentlyViewed } = useRecipeStore();
  const { toggleSaved, isSaved } = useSavedStore();
  const addMeal = usePlannerStore((s) => s.addMeal);
  const currentUserId = useUserStore((s) => s.profile?.id ?? null);
  const currentUserName = useUserStore((s) => s.profile?.name ?? 'You');
  const currentUserUsername = useUserStore((s) => s.profile?.username ?? null);

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [similar, setSimilar] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [servings, setServings] = useState(2);
  const [activeTab, setActiveTab] = useState<'ingredients' | 'steps'>('ingredients');

  const [plannerOpen, setPlannerOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Mon');
  const [selectedMeal, setSelectedMeal] = useState<MealType>('Lunch');

  const [socialLoading, setSocialLoading] = useState(true);
  const [likesCount, setLikesCount] = useState(0);
  const [dislikesCount, setDislikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [viewerReaction, setViewerReaction] = useState<'like' | 'dislike' | null>(null);
  const [canSeeDislikes, setCanSeeDislikes] = useState(false);

  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<RecipeCommentItem[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [replyParentId, setReplyParentId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [commentBusy, setCommentBusy] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  const pulse = useRef(new Animated.Value(1)).current;
  const socialRefreshDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isMealMitraAuthor = useMemo(() => {
    if (!recipe?.uploadedBy) return true;
    return recipe.source === 'app';
  }, [recipe?.uploadedBy, recipe?.source]);

  const authorLabel = useMemo(() => {
    if (!recipe) return 'MealMitra';
    if (isMealMitraAuthor) return 'MealMitra';
    if (recipe.uploadedByUsername) return `@${recipe.uploadedByUsername}`;
    return recipe.uploadedByName ?? 'Unknown User';
  }, [isMealMitraAuthor, recipe]);

  const refreshSocial = useCallback(async () => {
    if (!id) return;

    try {
      setSocialLoading(true);
      const [snapshot, thread] = await Promise.all([
        getRecipeSocialSnapshot(id, routeSource),
        getRecipeComments(id, routeSource),
      ]);
      setLikesCount(snapshot.likesCount);
      setDislikesCount(snapshot.dislikesCount);
      setCommentsCount(snapshot.commentsCount);
      setViewerReaction(snapshot.viewerReaction);
      setCanSeeDislikes(snapshot.canSeeDislikes);
      setComments(thread);
    } finally {
      setSocialLoading(false);
    }
  }, [id, routeSource]);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    fetchById(id, routeSource)
      .then((r) => {
        if (!r) return;
        addRecentlyViewed(r.id);
        setRecipe(r);
        setServings(r.servings);
        fetchSimilar(r).then(setSimilar);
      })
      .finally(() => setLoading(false));

    void refreshSocial();

    const reactionsChannel = supabase
      .channel(`recipe-realtime-${id}-${routeSource}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'recipe_reactions',
          filter: `recipe_id=eq.${id}`,
        },
        () => {
          if (socialRefreshDebounceRef.current) clearTimeout(socialRefreshDebounceRef.current);
          socialRefreshDebounceRef.current = setTimeout(() => {
            void refreshSocial();
          }, 120);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'recipe_comments',
          filter: `recipe_id=eq.${id}`,
        },
        () => {
          if (socialRefreshDebounceRef.current) clearTimeout(socialRefreshDebounceRef.current);
          socialRefreshDebounceRef.current = setTimeout(() => {
            void refreshSocial();
          }, 120);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comment_likes',
        },
        () => {
          if (commentsOpen) {
            if (socialRefreshDebounceRef.current) clearTimeout(socialRefreshDebounceRef.current);
            socialRefreshDebounceRef.current = setTimeout(() => {
              void refreshSocial();
            }, 120);
          }
        }
      )
      .subscribe();

    return () => {
      if (socialRefreshDebounceRef.current) clearTimeout(socialRefreshDebounceRef.current);
      void supabase.removeChannel(reactionsChannel);
    };
  }, [id, routeSource, fetchById, addRecentlyViewed, fetchSimilar, refreshSocial]);

  const animatePulse = () => {
    Animated.sequence([
      Animated.spring(pulse, { toValue: 1.12, useNativeDriver: true, speed: 18, bounciness: 10 }),
      Animated.spring(pulse, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 8 }),
    ]).start();
  };

  const handleToggleReaction = async (reactionType: 'like' | 'dislike') => {
    if (!recipe) return;
    const previous = {
      likesCount,
      dislikesCount,
      viewerReaction,
    };

    if (viewerReaction === reactionType) {
      if (reactionType === 'like') setLikesCount((v) => Math.max(0, v - 1));
      if (reactionType === 'dislike') setDislikesCount((v) => Math.max(0, v - 1));
      setViewerReaction(null);
    } else {
      if (reactionType === 'like') {
        setLikesCount((v) => v + 1);
        if (viewerReaction === 'dislike') setDislikesCount((v) => Math.max(0, v - 1));
      } else {
        setDislikesCount((v) => v + 1);
        if (viewerReaction === 'like') setLikesCount((v) => Math.max(0, v - 1));
      }
      setViewerReaction(reactionType);
    }

    try {
      await toggleRecipeReaction(recipe.id, routeSource, reactionType);
      animatePulse();
    } catch (error: any) {
      setLikesCount(previous.likesCount);
      setDislikesCount(previous.dislikesCount);
      setViewerReaction(previous.viewerReaction);
      setCommentError(error?.message ?? 'Unable to update reaction.');
    }
  };

  const updateCommentInTree = useCallback(
    (list: RecipeCommentItem[], commentId: string, updater: (item: RecipeCommentItem) => RecipeCommentItem): RecipeCommentItem[] =>
      list.map((item) => {
        if (item.id === commentId) {
          return updater(item);
        }
        if (item.replies.length > 0) {
          return { ...item, replies: updateCommentInTree(item.replies, commentId, updater) };
        }
        return item;
      }),
    []
  );

  const handleShare = async () => {
    if (!recipe) return;
    const deepLink = `mealmitra://recipe/${recipe.id}`;
    await Share.share({
      message: `Check out ${recipe.name} on MealMitra\n${deepLink}`,
      url: deepLink,
    });
  };

  const handleAddToPlan = () => {
    if (!recipe) return;
    addMeal(selectedDay, selectedMeal, recipe.id, servings, routeSource);
    setPlannerOpen(false);
  };

  const handleSubmitComment = async () => {
    if (!recipe || !commentInput.trim()) return;

    const payload = commentInput.trim();
    const previousComments = comments;
    const previousCount = commentsCount;

    try {
      setCommentBusy(true);
      setCommentError(null);

      if (editingCommentId) {
        setComments((list) =>
          updateCommentInTree(list, editingCommentId, (item) => ({
            ...item,
            content: payload,
            updatedAt: new Date().toISOString(),
          }))
        );
        await updateRecipeComment(editingCommentId, payload);
      } else {
        const nowIso = new Date().toISOString();
        const tempId = `temp-${Date.now()}`;
        const optimistic: RecipeCommentItem = {
          id: tempId,
          recipeId: recipe.id,
          recipeSource: routeSource,
          userId: currentUserId ?? 'me',
          parentId: replyParentId,
          content: payload,
          createdAt: nowIso,
          updatedAt: nowIso,
          userName: currentUserName,
          userUsername: currentUserUsername,
          likesCount: 0,
          likedByMe: false,
          replies: [],
        };

        setComments((list) => {
          if (!replyParentId) {
            return [...list, optimistic];
          }
          return updateCommentInTree(list, replyParentId, (parent) => ({
            ...parent,
            replies: [...parent.replies, optimistic],
          }));
        });
        setCommentsCount((v) => v + 1);

        await addRecipeComment(recipe.id, routeSource, payload, replyParentId);
      }

      setCommentInput('');
      setReplyParentId(null);
      setEditingCommentId(null);
      await refreshSocial();
    } catch (error: any) {
      setComments(previousComments);
      setCommentsCount(previousCount);
      const message = String(error?.message ?? 'Unable to post comment.');
      if (message.toLowerCase().includes('cooldown')) {
        setCommentError('Please wait 5 minutes before posting another comment.');
      } else {
        setCommentError(message);
      }
    } finally {
      setCommentBusy(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const previousComments = comments;
    const previousCount = commentsCount;

    const removeFromTree = (list: RecipeCommentItem[]): RecipeCommentItem[] => {
      const out: RecipeCommentItem[] = [];
      list.forEach((item) => {
        if (item.id === commentId) return;
        out.push({
          ...item,
          replies: removeFromTree(item.replies),
        });
      });
      return out;
    };

    try {
      setComments((list) => removeFromTree(list));
      setCommentsCount((v) => Math.max(0, v - 1));
      await deleteRecipeComment(commentId);
      await refreshSocial();
    } catch {
      setComments(previousComments);
      setCommentsCount(previousCount);
      setCommentError('Unable to delete comment.');
    }
  };

  const scaledQty = (qty: number) => {
    if (!recipe) return String(qty);
    const ratio = servings / recipe.servings;
    const scaled = qty * ratio;
    return scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(1);
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFound, { color: colors.text }]}>Recipe not found</Text>
      </View>
    );
  }

  const saved = isSaved(recipe.id);
  const dietColor = recipe.diet === 'Vegetarian' || recipe.diet === 'Vegan' ? colors.veg : colors.nonVeg;

  const renderComment = (item: RecipeCommentItem, isReply = false) => (
    <View key={item.id} style={[styles.commentCard, { backgroundColor: colors.surface, marginLeft: isReply ? 16 : 0 }]}> 
      <View style={styles.commentHeader}>
        <Text style={[styles.commentAuthor, { color: colors.text }]}>{item.userName}</Text>
        {item.userUsername ? <Text style={[styles.commentUsername, { color: colors.textSecondary }]}>@{item.userUsername}</Text> : null}
        <Text style={[styles.commentDate, { color: colors.textSecondary }]}>{new Date(item.createdAt).toLocaleString()}</Text>
      </View>
      <Text style={[styles.commentBody, { color: colors.text }]}>{item.content}</Text>
      <View style={styles.commentActions}>
        <TouchableOpacity
          style={styles.inlineBtn}
          onPress={() => {
            const wasLiked = item.likedByMe;
            setComments((list) =>
              updateCommentInTree(list, item.id, (target) => ({
                ...target,
                likedByMe: !target.likedByMe,
                likesCount: Math.max(0, target.likesCount + (target.likedByMe ? -1 : 1)),
              }))
            );

            toggleCommentLike(item.id).catch(() => {
              setComments((list) =>
                updateCommentInTree(list, item.id, (target) => ({
                  ...target,
                  likedByMe: wasLiked,
                  likesCount: Math.max(0, target.likesCount + (wasLiked ? 1 : -1)),
                }))
              );
              setCommentError('Unable to like comment.');
            });
          }}
        >
          <Ionicons name={item.likedByMe ? 'heart' : 'heart-outline'} size={14} color={item.likedByMe ? colors.accent : colors.textSecondary} />
          <Text style={[styles.inlineBtnText, { color: colors.textSecondary }]}>{item.likesCount}</Text>
        </TouchableOpacity>

        {!isReply && (
          <TouchableOpacity
            style={styles.inlineBtn}
            onPress={() => {
              setReplyParentId(item.id);
              setEditingCommentId(null);
              setCommentInput('');
            }}
          >
            <Ionicons name="return-up-forward-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.inlineBtnText, { color: colors.textSecondary }]}>Reply</Text>
          </TouchableOpacity>
        )}

        {item.userId === currentUserId && (
          <>
            <TouchableOpacity
              style={styles.inlineBtn}
              onPress={() => {
                setEditingCommentId(item.id);
                setReplyParentId(null);
                setCommentInput(item.content);
              }}
            >
              <Ionicons name="create-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.inlineBtnText, { color: colors.textSecondary }]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.inlineBtn} onPress={() => handleDeleteComment(item.id)}>
              <Ionicons name="trash-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.inlineBtnText, { color: colors.textSecondary }]}>Delete</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {item.replies.map((reply) => renderComment(reply, true))}
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      <View style={[styles.floatingHeader, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.floatingBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.floatingRight}>
          <TouchableOpacity style={styles.floatingBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={22} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.floatingBtn} onPress={() => toggleSaved(recipe.id)}>
            <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={22} color={saved ? '#FF6B35' : '#FFF'} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <FallbackImage uri={recipe.image} style={styles.heroImage} resizeMode="cover" />

        <View style={styles.content}>
          <View style={styles.recipeHeader}>
            <View style={styles.cuisineRow}>
              <View style={[styles.dietDot, { backgroundColor: dietColor }]} />
              <Text style={[styles.cuisineText, { color: colors.textSecondary }]}>{recipe.cuisine}</Text>
              <Text style={[styles.dietText, { color: dietColor }]}>{recipe.diet}</Text>
            </View>
            <Text style={[styles.recipeName, { color: colors.text }]}>{recipe.name}</Text>
            <View style={styles.authorRow}>
              <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
              {isMealMitraAuthor ? (
                <Text style={[styles.authorText, { color: colors.textSecondary }]}>{authorLabel}</Text>
              ) : (
                <TouchableOpacity onPress={() => router.push({ pathname: '/user/[id]', params: { id: recipe.uploadedBy! } } as any)}>
                  <Text style={[styles.authorLink, { color: colors.accent }]}>{authorLabel}</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={[styles.description, { color: colors.textSecondary }]}>{recipe.description}</Text>

            <Animated.View style={{ transform: [{ scale: pulse }] }}>
              <View style={[styles.socialRow, { backgroundColor: colors.surface }]}> 
                <TouchableOpacity style={styles.socialBtn} onPress={() => handleToggleReaction('like')}>
                  <Ionicons name={viewerReaction === 'like' ? 'heart' : 'heart-outline'} size={18} color={viewerReaction === 'like' ? colors.accent : colors.textSecondary} />
                  <Text style={[styles.socialText, { color: colors.text }]}>{likesCount}</Text>
                </TouchableOpacity>

                {canSeeDislikes && (
                  <TouchableOpacity style={styles.socialBtn} onPress={() => handleToggleReaction('dislike')}>
                    <Ionicons name={viewerReaction === 'dislike' ? 'thumbs-down' : 'thumbs-down-outline'} size={18} color={viewerReaction === 'dislike' ? colors.accent : colors.textSecondary} />
                    <Text style={[styles.socialText, { color: colors.text }]}>{dislikesCount}</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.socialBtn} onPress={() => setCommentsOpen((v) => !v)}>
                  <Ionicons name="chatbubble-outline" size={18} color={colors.textSecondary} />
                  <Text style={[styles.socialText, { color: colors.text }]}>{commentsCount}</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>

          <View style={styles.primaryActionRow}>
            <TouchableOpacity style={[styles.primaryActionBtn, { backgroundColor: colors.accent }]} onPress={() => setPlannerOpen(true)}>
              <Ionicons name="calendar-outline" size={18} color="#FFF" />
              <Text style={styles.primaryActionText}>Add to Plan</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.secondaryActionBtn, { borderColor: colors.border, backgroundColor: colors.surface }]} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={18} color={colors.text} />
              <Text style={[styles.secondaryActionText, { color: colors.text }]}>Share</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.cookBtn, { backgroundColor: colors.accent }]}
            onPress={() =>
              router.push({
                pathname: '/recipe/cooking/[id]',
                params: { id: recipe.id, source: routeSource },
              } as any)
            }
          >
            <Ionicons name="play-circle-outline" size={24} color="#FFF" />
            <Text style={styles.cookBtnText}>Start Cooking</Text>
          </TouchableOpacity>

          <NutritionBadge
            protein={recipe.nutrition.protein}
            carbs={recipe.nutrition.carbs}
            fat={recipe.nutrition.fat}
            fiber={recipe.nutrition.fiber}
            sugar={recipe.nutrition.sugar}
            calories={recipe.calories}
          />

          <View style={[styles.section, { backgroundColor: colors.surface }]}> 
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Adjust Servings</Text>
            <View style={styles.servingsRow}>
              <TouchableOpacity style={[styles.servingBtn, { backgroundColor: colors.accent }]} onPress={() => setServings((v) => Math.max(1, v - 1))}>
                <Ionicons name="remove" size={20} color="#FFF" />
              </TouchableOpacity>
              <Text style={[styles.servingsValue, { color: colors.text }]}>{servings}</Text>
              <TouchableOpacity style={[styles.servingBtn, { backgroundColor: colors.accent }]} onPress={() => setServings((v) => v + 1)}>
                <Ionicons name="add" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.tabRow, { backgroundColor: colors.surface }]}> 
            {(['ingredients', 'steps'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && { backgroundColor: colors.accent }]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, { color: activeTab === tab ? '#FFF' : colors.textSecondary }]}>
                  {tab === 'ingredients' ? 'Ingredients' : 'Steps'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === 'ingredients' ? (
            <View style={styles.ingList}>
              {recipe.ingredients.map((ing, idx) => (
                <View key={`${ing.name}-${idx}`} style={[styles.ingRow, { backgroundColor: colors.surface }]}> 
                  <Text style={[styles.ingName, { color: colors.text }]}>{ing.name}</Text>
                  <Text style={[styles.ingQty, { color: colors.textSecondary }]}>
                    {ing.quantity > 0 ? `${scaledQty(ing.quantity)} ${ing.unit}`.trim() : ing.unit}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.stepsContainer}>
              {recipe.steps.map((step) => (
                <View key={step.step} style={[styles.stepCard, { backgroundColor: colors.surface }]}> 
                  <View style={[styles.stepNumber, { backgroundColor: colors.accent }]}>
                    <Text style={styles.stepNumberText}>{step.step}</Text>
                  </View>
                  <Text style={[styles.stepInstruction, { color: colors.text }]}>{step.instruction}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={[styles.section, { backgroundColor: colors.surface }]}> 
            <TouchableOpacity style={styles.commentsHeader} onPress={() => setCommentsOpen((v) => !v)}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Comments</Text>
              {socialLoading ? <ActivityIndicator size="small" color={colors.accent} /> : <Ionicons name={commentsOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />}
            </TouchableOpacity>

            {commentsOpen && (
              <>
                {(replyParentId || editingCommentId) && (
                  <View style={[styles.modeChip, { backgroundColor: colors.accentLight }]}> 
                    <Text style={[styles.modeChipText, { color: colors.accent }]}>
                      {editingCommentId ? 'Editing comment' : 'Replying to comment'}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setReplyParentId(null);
                        setEditingCommentId(null);
                        setCommentInput('');
                      }}
                    >
                      <Ionicons name="close" size={14} color={colors.accent} />
                    </TouchableOpacity>
                  </View>
                )}

                <View style={[styles.commentInputWrap, { borderColor: colors.border }]}> 
                  <TextInput
                    value={commentInput}
                    onChangeText={setCommentInput}
                    placeholder="Write a comment..."
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    style={[styles.commentInput, { color: colors.text }]}
                  />
                  <TouchableOpacity
                    style={[styles.sendBtn, { backgroundColor: colors.accent, opacity: commentBusy ? 0.7 : 1 }]}
                    onPress={handleSubmitComment}
                    disabled={commentBusy}
                  >
                    <Ionicons name="send" size={16} color="#FFF" />
                  </TouchableOpacity>
                </View>

                {commentError ? <Text style={[styles.commentError, { color: '#E11D48' }]}>{commentError}</Text> : null}

                <View style={styles.commentList}>{comments.map((item) => renderComment(item))}</View>
              </>
            )}
          </View>

          {similar.length > 0 && (
            <View>
              <Text style={[styles.sectionTitleLg, { color: colors.text }]}>Similar Recipes</Text>
              {similar.slice(0, 3).map((r) => (
                <RecipeCard key={r.id} recipe={r} horizontal />
              ))}
            </View>
          )}

          <View style={{ height: insets.bottom + Spacing['2xl'] }} />
        </View>
      </ScrollView>

      <Modal transparent visible={plannerOpen} animationType="slide" onRequestClose={() => setPlannerOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}> 
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add to Plan</Text>
            <Text style={[styles.modalSub, { color: colors.textSecondary }]}>Select day and meal slot</Text>

            <Text style={[styles.modalLabel, { color: colors.text }]}>Day</Text>
            <View style={styles.chipWrap}>
              {DAYS.map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[styles.chip, { backgroundColor: selectedDay === day ? colors.accent : colors.surface }]}
                  onPress={() => setSelectedDay(day)}
                >
                  <Text style={{ color: selectedDay === day ? '#FFF' : colors.text }}>{day}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.modalLabel, { color: colors.text }]}>Meal</Text>
            <View style={styles.chipWrap}>
              {MEALS.map((meal) => (
                <TouchableOpacity
                  key={meal}
                  style={[styles.chip, { backgroundColor: selectedMeal === meal ? colors.accent : colors.surface }]}
                  onPress={() => setSelectedMeal(meal)}
                >
                  <Text style={{ color: selectedMeal === meal ? '#FFF' : colors.text }}>{meal}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.surface }]} onPress={() => setPlannerOpen(false)}>
                <Text style={{ color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.accent }]} onPress={handleAddToPlan}>
                <Text style={{ color: '#FFF', fontWeight: '700' }}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFound: { fontSize: Typography.fontSize.lg },
  heroImage: { width, height: IMAGE_HEIGHT },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
  },
  floatingBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingRight: { flexDirection: 'row', gap: Spacing.sm },
  content: { padding: Spacing.base, gap: Spacing.md },
  recipeHeader: { gap: Spacing.sm },
  cuisineRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dietDot: { width: 8, height: 8, borderRadius: 4 },
  cuisineText: { fontSize: Typography.fontSize.sm, fontWeight: '600' },
  dietText: { fontSize: Typography.fontSize.xs, fontWeight: '700', textTransform: 'uppercase' },
  recipeName: { fontSize: Typography.fontSize['2xl'], fontWeight: '900', lineHeight: 32 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  authorText: { fontSize: Typography.fontSize.sm },
  authorLink: { fontSize: Typography.fontSize.sm, fontWeight: '700' },
  description: { fontSize: Typography.fontSize.base, lineHeight: 22 },
  socialRow: {
    borderRadius: BorderRadius.full,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    gap: 12,
    alignSelf: 'flex-start',
  },
  socialBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  socialText: { fontWeight: '700' },
  primaryActionRow: { flexDirection: 'row', gap: Spacing.sm },
  primaryActionBtn: {
    flex: 1,
    borderRadius: BorderRadius.full,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadow.md,
  },
  primaryActionText: { color: '#FFF', fontWeight: '800' },
  secondaryActionBtn: {
    flex: 1,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryActionText: { fontWeight: '700' },
  cookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderRadius: BorderRadius.full,
    height: 54,
    ...Shadow.md,
  },
  cookBtnText: { color: '#FFF', fontSize: Typography.fontSize.lg, fontWeight: '800' },
  section: { borderRadius: BorderRadius.lg, padding: Spacing.base, gap: Spacing.sm },
  sectionTitle: { fontSize: Typography.fontSize.base, fontWeight: '700' },
  sectionTitleLg: { fontSize: Typography.fontSize.lg, fontWeight: '800', marginBottom: Spacing.sm },
  servingsRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  servingBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  servingsValue: { fontSize: Typography.fontSize.xl, fontWeight: '800', minWidth: 30, textAlign: 'center' },
  tabRow: { flexDirection: 'row', borderRadius: BorderRadius.full, padding: 4, gap: 4 },
  tab: { flex: 1, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, alignItems: 'center' },
  tabText: { fontWeight: '700', fontSize: Typography.fontSize.base },
  ingList: { gap: Spacing.sm },
  ingRow: { flexDirection: 'row', justifyContent: 'space-between', borderRadius: BorderRadius.lg, padding: Spacing.md, gap: Spacing.sm },
  ingName: { flex: 1, fontSize: Typography.fontSize.base, fontWeight: '600' },
  ingQty: { fontSize: Typography.fontSize.base, fontWeight: '700' },
  stepsContainer: { gap: Spacing.sm },
  stepCard: { flexDirection: 'row', gap: Spacing.md, borderRadius: BorderRadius.lg, padding: Spacing.md },
  stepNumber: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { color: '#FFF', fontWeight: '800', fontSize: Typography.fontSize.base },
  stepInstruction: { flex: 1, fontSize: Typography.fontSize.base, lineHeight: 22 },
  commentsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modeChip: {
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modeChipText: { fontWeight: '700', fontSize: Typography.fontSize.xs },
  commentInputWrap: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  commentInput: { flex: 1, minHeight: 52, maxHeight: 120, textAlignVertical: 'top' },
  sendBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  commentError: { fontSize: Typography.fontSize.xs, fontWeight: '600' },
  commentList: { gap: Spacing.sm },
  commentCard: { borderRadius: BorderRadius.lg, padding: Spacing.sm, gap: 6 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  commentAuthor: { fontWeight: '700' },
  commentUsername: { fontSize: Typography.fontSize.xs, fontWeight: '600' },
  commentDate: { fontSize: Typography.fontSize.xs },
  commentBody: { lineHeight: 20 },
  commentActions: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  inlineBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  inlineBtnText: { fontSize: Typography.fontSize.xs, fontWeight: '600' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.42)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  modalTitle: { fontSize: Typography.fontSize.lg, fontWeight: '800' },
  modalSub: { fontSize: Typography.fontSize.sm, marginBottom: 4 },
  modalLabel: { fontSize: Typography.fontSize.sm, fontWeight: '700', marginTop: 8 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  modalBtn: {
    flex: 1,
    borderRadius: BorderRadius.full,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

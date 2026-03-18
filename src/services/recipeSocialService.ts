import { supabase } from './supabase';
import type { RecipeSource } from '../types';

export type RecipeReactionType = 'like' | 'dislike';

export interface RecipeSocialSnapshot {
  likesCount: number;
  dislikesCount: number;
  commentsCount: number;
  viewerReaction: RecipeReactionType | null;
  canSeeDislikes: boolean;
}

type PublicCounter = {
  likesCount: number;
  commentsCount: number;
};

const publicCounterCache = new Map<string, { data: PublicCounter; expiresAt: number }>();
const pendingPublicCounter = new Map<RecipeSource, {
  ids: Set<string>;
  resolvers: Map<string, Array<(value: PublicCounter) => void>>;
  timer: ReturnType<typeof setTimeout> | null;
}>();

const PUBLIC_COUNTER_TTL_MS = 1000 * 20;

export interface RecipeCommentItem {
  id: string;
  recipeId: string;
  recipeSource: RecipeSource;
  userId: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
  userName: string;
  userUsername: string | null;
  likesCount: number;
  likedByMe: boolean;
  replies: RecipeCommentItem[];
}

async function getCurrentUserId(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

export async function isRecipeOwner(recipeId: string, source: RecipeSource, userId?: string | null): Promise<boolean> {
  const uid = userId ?? (await getCurrentUserId());
  if (!uid) return false;

  if (source === 'ai') {
    const { data, error } = await supabase
      .from('user_ai_generated_recipes')
      .select('user_id')
      .eq('id', recipeId)
      .maybeSingle();

    if (error || !data) return false;
    return data.user_id === uid;
  }

  const { data, error } = await supabase
    .from('master_recipes')
    .select('uploaded_by,source')
    .eq('id', recipeId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error || !data) return false;
  return data.uploaded_by === uid && data.source === 'user_upload';
}

export async function getRecipeSocialSnapshot(recipeId: string, source: RecipeSource): Promise<RecipeSocialSnapshot> {
  const uid = await getCurrentUserId();
  const canSeeDislikes = await isRecipeOwner(recipeId, source, uid);

  const [likesResp, commentsResp, myReactionResp, dislikesResp] = await Promise.all([
    supabase
      .from('recipe_reactions')
      .select('*', { head: true, count: 'exact' })
      .eq('recipe_id', recipeId)
      .eq('recipe_source', source)
      .eq('reaction_type', 'like'),
    supabase
      .from('recipe_comments')
      .select('*', { head: true, count: 'exact' })
      .eq('recipe_id', recipeId)
      .eq('recipe_source', source),
    uid
      ? supabase
          .from('recipe_reactions')
          .select('reaction_type')
          .eq('recipe_id', recipeId)
          .eq('recipe_source', source)
          .eq('user_id', uid)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null } as any),
    canSeeDislikes
      ? supabase
          .from('recipe_reactions')
          .select('*', { head: true, count: 'exact' })
          .eq('recipe_id', recipeId)
          .eq('recipe_source', source)
          .eq('reaction_type', 'dislike')
      : Promise.resolve({ count: 0, error: null } as any),
  ]);

  return {
    likesCount: likesResp.count ?? 0,
    dislikesCount: canSeeDislikes ? dislikesResp.count ?? 0 : 0,
    commentsCount: commentsResp.count ?? 0,
    viewerReaction: (myReactionResp?.data?.reaction_type as RecipeReactionType | undefined) ?? null,
    canSeeDislikes,
  };
}

export async function toggleRecipeReaction(recipeId: string, source: RecipeSource, reactionType: RecipeReactionType) {
  const uid = await getCurrentUserId();
  if (!uid) {
    throw new Error('Please log in to react.');
  }

  const { data: existing } = await supabase
    .from('recipe_reactions')
    .select('id,reaction_type')
    .eq('recipe_id', recipeId)
    .eq('recipe_source', source)
    .eq('user_id', uid)
    .maybeSingle();

  if (existing?.reaction_type === reactionType) {
    const { error } = await supabase
      .from('recipe_reactions')
      .delete()
      .eq('id', existing.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from('recipe_reactions')
    .upsert(
      {
        recipe_id: recipeId,
        recipe_source: source,
        user_id: uid,
        reaction_type: reactionType,
      },
      { onConflict: 'user_id,recipe_source,recipe_id' }
    );

  if (error) throw error;
}

export async function getRecipeComments(recipeId: string, source: RecipeSource): Promise<RecipeCommentItem[]> {
  const uid = await getCurrentUserId();

  const { data: commentRows, error } = await supabase
    .from('recipe_comments')
    .select('id,recipe_id,recipe_source,user_id,parent_id,content,created_at,updated_at')
    .eq('recipe_id', recipeId)
    .eq('recipe_source', source)
    .order('created_at', { ascending: true });

  if (error) throw error;

  const comments = (commentRows ?? []) as any[];
  if (comments.length === 0) return [];

  const userIds = Array.from(new Set(comments.map((row) => String(row.user_id)).filter(Boolean)));

  const { data: profileRows, error: profileError } = await supabase
    .from('user_profiles')
    .select('id,name,username')
    .in('id', userIds);

  if (profileError) throw profileError;

  const profileByUserId = new Map<string, { name: string | null; username: string | null }>();
  ((profileRows ?? []) as any[]).forEach((row) => {
    profileByUserId.set(String(row.id), {
      name: row.name ? String(row.name) : null,
      username: row.username ? String(row.username) : null,
    });
  });

  const commentIds = comments.map((row) => String(row.id));

  const [likesRowsResp, myLikeRowsResp] = await Promise.all([
    supabase
      .from('comment_likes')
      .select('comment_id')
      .in('comment_id', commentIds),
    uid
      ? supabase
          .from('comment_likes')
          .select('comment_id')
          .in('comment_id', commentIds)
          .eq('user_id', uid)
      : Promise.resolve({ data: [], error: null } as any),
  ]);

  if (likesRowsResp.error) throw likesRowsResp.error;
  if (myLikeRowsResp.error) throw myLikeRowsResp.error;

  const likesCountByComment = new Map<string, number>();
  ((likesRowsResp.data ?? []) as any[]).forEach((row) => {
    const key = String(row.comment_id);
    likesCountByComment.set(key, (likesCountByComment.get(key) ?? 0) + 1);
  });

  const myLikedSet = new Set(((myLikeRowsResp.data ?? []) as any[]).map((row) => String(row.comment_id)));

  const flat = comments.map((row) => {
    const profile = profileByUserId.get(String(row.user_id));
    return {
      id: String(row.id),
      recipeId: String(row.recipe_id),
      recipeSource: row.recipe_source as RecipeSource,
      userId: String(row.user_id),
      parentId: row.parent_id ? String(row.parent_id) : null,
      content: String(row.content ?? ''),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
      userName: String(profile?.name ?? profile?.username ?? 'Unknown User'),
      userUsername: profile?.username ? String(profile.username) : null,
      likesCount: likesCountByComment.get(String(row.id)) ?? 0,
      likedByMe: myLikedSet.has(String(row.id)),
      replies: [],
    } as RecipeCommentItem;
  });

  const mapById = new Map(flat.map((item) => [item.id, item]));
  const roots: RecipeCommentItem[] = [];

  flat.forEach((item) => {
    if (item.parentId) {
      const parent = mapById.get(item.parentId);
      if (parent) {
        parent.replies = [...parent.replies, item];
        return;
      }
    }
    roots.push(item);
  });

  return roots;
}

export async function addRecipeComment(recipeId: string, source: RecipeSource, content: string, parentId?: string | null) {
  const trimmed = content.trim();
  if (!trimmed) throw new Error('Comment cannot be empty.');

  const { error } = await supabase.rpc('create_recipe_comment', {
    p_recipe_id: recipeId,
    p_recipe_source: source,
    p_content: trimmed,
    p_parent_id: parentId ?? null,
  });

  if (error) throw error;
}

export async function updateRecipeComment(commentId: string, content: string) {
  const trimmed = content.trim();
  if (!trimmed) throw new Error('Comment cannot be empty.');

  const { error } = await supabase
    .from('recipe_comments')
    .update({ content: trimmed })
    .eq('id', commentId);

  if (error) throw error;
}

export async function deleteRecipeComment(commentId: string) {
  const { error } = await supabase
    .from('recipe_comments')
    .delete()
    .eq('id', commentId);

  if (error) throw error;
}

export async function toggleCommentLike(commentId: string) {
  const uid = await getCurrentUserId();
  if (!uid) {
    throw new Error('Please log in to like comments.');
  }

  const { data: existing } = await supabase
    .from('comment_likes')
    .select('id')
    .eq('comment_id', commentId)
    .eq('user_id', uid)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('comment_likes')
      .delete()
      .eq('id', existing.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from('comment_likes')
    .insert({
      comment_id: commentId,
      user_id: uid,
    });

  if (error) throw error;
}

export async function getRecipeEngagementMap(recipeIds: string[], source: RecipeSource, includeDislikes: boolean) {
  const ids = Array.from(new Set(recipeIds.filter(Boolean)));
  const out = new Map<string, { likesCount: number; dislikesCount: number; commentsCount: number }>();

  if (ids.length === 0) return out;

  const [reactionsResp, commentsResp] = await Promise.all([
    supabase
      .from('recipe_reactions')
      .select('recipe_id,reaction_type')
      .in('recipe_id', ids)
      .eq('recipe_source', source),
    supabase
      .from('recipe_comments')
      .select('recipe_id')
      .in('recipe_id', ids)
      .eq('recipe_source', source),
  ]);

  if (reactionsResp.error) throw reactionsResp.error;
  if (commentsResp.error) throw commentsResp.error;

  ids.forEach((id) => {
    out.set(id, { likesCount: 0, dislikesCount: 0, commentsCount: 0 });
  });

  ((reactionsResp.data ?? []) as any[]).forEach((row) => {
    const key = String(row.recipe_id);
    const current = out.get(key);
    if (!current) return;

    if (row.reaction_type === 'like') current.likesCount += 1;
    if (includeDislikes && row.reaction_type === 'dislike') current.dislikesCount += 1;
  });

  ((commentsResp.data ?? []) as any[]).forEach((row) => {
    const key = String(row.recipe_id);
    const current = out.get(key);
    if (!current) return;
    current.commentsCount += 1;
  });

  return out;
}

async function getPublicCounterMap(recipeIds: string[], source: RecipeSource): Promise<Map<string, PublicCounter>> {
  const ids = Array.from(new Set(recipeIds.filter(Boolean)));
  const out = new Map<string, PublicCounter>();

  if (ids.length === 0) return out;

  const [reactionsResp, commentsResp] = await Promise.all([
    supabase
      .from('recipe_reactions')
      .select('recipe_id,reaction_type')
      .in('recipe_id', ids)
      .eq('recipe_source', source)
      .eq('reaction_type', 'like'),
    supabase
      .from('recipe_comments')
      .select('recipe_id')
      .in('recipe_id', ids)
      .eq('recipe_source', source),
  ]);

  if (reactionsResp.error) throw reactionsResp.error;
  if (commentsResp.error) throw commentsResp.error;

  ids.forEach((id) => {
    out.set(id, { likesCount: 0, commentsCount: 0 });
  });

  ((reactionsResp.data ?? []) as any[]).forEach((row) => {
    const recipeId = String(row.recipe_id);
    const current = out.get(recipeId);
    if (!current) return;
    current.likesCount += 1;
  });

  ((commentsResp.data ?? []) as any[]).forEach((row) => {
    const recipeId = String(row.recipe_id);
    const current = out.get(recipeId);
    if (!current) return;
    current.commentsCount += 1;
  });

  return out;
}

function getBatchBucket(source: RecipeSource) {
  let bucket = pendingPublicCounter.get(source);
  if (bucket) return bucket;

  bucket = {
    ids: new Set<string>(),
    resolvers: new Map<string, Array<(value: PublicCounter) => void>>(),
    timer: null,
  };
  pendingPublicCounter.set(source, bucket);
  return bucket;
}

async function flushPublicCounterBatch(source: RecipeSource) {
  const bucket = pendingPublicCounter.get(source);
  if (!bucket) return;

  bucket.timer = null;
  const ids = Array.from(bucket.ids);
  if (ids.length === 0) return;

  bucket.ids.clear();

  try {
    const map = await getPublicCounterMap(ids, source);

    ids.forEach((id) => {
      const value = map.get(id) ?? { likesCount: 0, commentsCount: 0 };
      publicCounterCache.set(`${source}:${id}`, {
        data: value,
        expiresAt: Date.now() + PUBLIC_COUNTER_TTL_MS,
      });

      const resolvers = bucket.resolvers.get(id) ?? [];
      bucket.resolvers.delete(id);
      resolvers.forEach((resolve) => resolve(value));
    });
  } catch {
    ids.forEach((id) => {
      const resolvers = bucket.resolvers.get(id) ?? [];
      bucket.resolvers.delete(id);
      resolvers.forEach((resolve) => resolve({ likesCount: 0, commentsCount: 0 }));
    });
  }
}

export async function getRecipePublicCountersBatched(recipeId: string, source: RecipeSource): Promise<PublicCounter> {
  const key = `${source}:${recipeId}`;
  const cached = publicCounterCache.get(key);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const bucket = getBatchBucket(source);
  bucket.ids.add(recipeId);

  return new Promise((resolve) => {
    const arr = bucket.resolvers.get(recipeId) ?? [];
    arr.push(resolve);
    bucket.resolvers.set(recipeId, arr);

    if (!bucket.timer) {
      bucket.timer = setTimeout(() => {
        void flushPublicCounterBatch(source);
      }, 40);
    }
  });
}

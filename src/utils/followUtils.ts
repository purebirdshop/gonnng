import { Creator } from '../types';

/**
 * Ensures creator array has complete followerIds and followingIds populated if missing.
 */
export function hydrateCreators(saved: Creator[]): Creator[] {
  if (!Array.isArray(saved)) {
    return [];
  }

  return saved.map(s => {
    const followerIds = Array.isArray(s.followerIds) ? s.followerIds : [];
    const followingIds = Array.isArray(s.followingIds) ? s.followingIds : [];
    return {
      ...s,
      followerIds,
      followingIds,
      followersCount: followerIds.length,
      followingCount: followingIds.length
    };
  });
}

/**
 * Checks if userA follows targetUserId based on userA's followingIds or targetUser's followerIds.
 */
export function isFollowingUser(userA?: Creator | null, targetUserId?: string | null, allCreators?: Creator[]): boolean {
  if (!userA || !targetUserId) return false;
  if (userA.id === targetUserId) return true;
  
  if (Array.isArray(userA.followingIds) && userA.followingIds.includes(targetUserId)) {
    return true;
  }
  
  if (allCreators) {
    const targetUser = allCreators.find(c => c.id === targetUserId);
    if (targetUser && Array.isArray(targetUser.followerIds) && targetUser.followerIds.includes(userA.id)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Checks if targetUserId follows userA (targetUser is in userA's followerIds).
 */
export function isFollowedByUser(userA?: Creator | null, targetUserId?: string | null, allCreators?: Creator[]): boolean {
  if (!userA || !targetUserId) return false;
  if (userA.id === targetUserId) return true;
  
  if (Array.isArray(userA.followerIds) && userA.followerIds.includes(targetUserId)) {
    return true;
  }
  
  if (allCreators) {
    const targetUser = allCreators.find(c => c.id === targetUserId);
    if (targetUser && Array.isArray(targetUser.followingIds) && targetUser.followingIds.includes(userA.id)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Mutual follow check: Are userA and targetUserId in a Circle together?
 * (userA follows targetUserId AND targetUserId follows userA)
 */
export function isUserInCircle(userA?: Creator | null, targetUserId?: string | null, allCreators?: Creator[]): boolean {
  if (!userA || !targetUserId) return false;
  if (userA.id === targetUserId) return true;
  return isFollowingUser(userA, targetUserId, allCreators) && isFollowedByUser(userA, targetUserId, allCreators);
}

/**
 * Returns all creators who are in profileUser's circle (mutual follow).
 */
export function getCircleOfUser(profileUser: Creator, allCreators: Creator[]): Creator[] {
  return allCreators.filter(c => c.id !== profileUser.id && isUserInCircle(profileUser, c.id, allCreators));
}

/**
 * Returns all creators who follow profileUser
 */
export function getFollowersOfUser(profileUser: Creator, allCreators: Creator[]): Creator[] {
  const ids = profileUser.followerIds || [];
  return allCreators.filter(c => c.id !== profileUser.id && (ids.includes(c.id) || (Array.isArray(c.followingIds) && c.followingIds.includes(profileUser.id))));
}

/**
 * Returns all creators whom profileUser is following
 */
export function getFollowingOfUser(profileUser: Creator, allCreators: Creator[]): Creator[] {
  const ids = profileUser.followingIds || [];
  return allCreators.filter(c => c.id !== profileUser.id && (ids.includes(c.id) || (Array.isArray(c.followerIds) && c.followerIds.includes(profileUser.id))));
}

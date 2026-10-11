// ============================================================================
// RFC 9457 PROBLEM DETAILS
// ============================================================================

export interface ProblemDetailsResponse {
  type: string;                    // Problem type URI (default: "about:blank")
  title: string;                   // Short human-readable summary
  status: number;                  // HTTP status code (e.g. 400, 401, 404, 409)
  detail: string;                  // Occurrence-specific explanation
  code: string;                    // Application machine-readable error code
  instance?: string;               // Correlation ID (x-request-id)
  errors?: Record<string, string[]>; // Field-level validation error map
}

// ============================================================================
// ENUMS & PRIMITIVES
// ============================================================================

export type UserRole = "USER" | "ADMIN";
export type UserStatus = "ACTIVE" | "SUSPENDED" | "DELETED";
export type NotificationType = "LIKE" | "REPOST" | "FOLLOW";
export type FeedItemType = "ORIGINAL_QUOTE" | "REPOST";

// ============================================================================
// DOMAIN MODELS
// ============================================================================

export interface UserProfile {
  id: string;                      // UUIDv7
  username: string;                // 3-30 chars, alphanumeric + underscore
  displayName: string;             // 1-50 chars
  bio: string | null;              // Max 160 chars
  profileImageUrl: string | null;  // CDN URL to 400x400 WebP avatar
  role: UserRole;
  status: UserStatus;
  followerCount: number;
  followingCount: number;
  createdAt: string;               // ISO 8601 date string
  updatedAt: string;
}

export interface Theme {
  id: string;                      // UUIDv7
  key: string;                     // e.g. "classic-serif", "modern-sans"
  name: string;                    // Display name: "Classic Serif"
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Quote {
  id: string;                      // UUIDv7
  userId: string;                  // Author UUID
  text: string;                    // 1-280 Unicode characters
  isOriginal: boolean;             // True if user is author
  authorName: string | null;       // Null if isOriginal is true
  themeId?: string;                 // Target theme UUID
  themeKey?: string;                // Target theme key (e.g. "classic-serif")
  likeCount: number;
  repostCount: number;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string | null;
  user?: Pick<UserProfile, "id" | "username" | "displayName" | "profileImageUrl">;
  theme?: Theme;
}

export interface FeedActor {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  profileImageUrl?: string | null;
}

export interface FeedAuthor {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  profileImageUrl?: string | null;
}

export interface FeedQuote {
  id: string;
  text: string;
  isOriginal: boolean;
  authorName: string | null;
  likeCount: number;
  repostCount: number;
  createdAt: string;
  themeKey?: string;
  author: FeedAuthor;
}

export interface FeedItem {
  type: FeedItemType;              // "ORIGINAL_QUOTE" | "REPOST"
  actor: FeedActor;                // The user who posted or reposted
  quote: FeedQuote;                // Canonical quote payload
  createdAt: string;               // Event timestamp
}

export interface SearchResult {
  id: string;
  text: string;
  isOriginal: boolean;
  authorName: string | null;
  likeCount: number;
  repostCount: number;
  createdAt: string;
  rankScore: number;               // Trigram similarity rank
  username: string;
  displayName: string;
  themeKey?: string | null;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    profileImageUrl: string | null;
  };
}

export interface NotificationItem {
  id: string;
  userId: string;
  actorId: string;
  type: NotificationType;          // "LIKE" | "REPOST" | "FOLLOW"
  entityId: string;                // quoteId or userId
  readAt: string | null;           // null if unread
  createdAt: string;
  actor: {
    id: string;
    username: string;
    displayName: string;
    profileImageUrl: string | null;
  };
}

export interface DailyMetric {
  metricDate: string;              // "YYYY-MM-DD"
  registeredUsers: number;
  activeUsers: number;
  quotesCreated: number;
  likesCreated: number;
  repostsCreated: number;
  bookmarksCreated: number;
  followsCreated: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  actorUserId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actorUser: {
    id: string;
    username: string;
    displayName: string;
  };
}

// ============================================================================
// API RESPONSES & ENVELOPES
// ============================================================================

export interface PaginationMeta {
  nextCursor: string | null;
  hasMore: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export type PaginatedList<T> = PaginatedResponse<T>;

export interface FeedResponse {
  data: FeedItem[];
  pagination: PaginationMeta;
}

export interface PresignedUploadResponse {
  uploadUrl: string;               // Direct PUT URL to Cloudflare R2 / S3
  key: string;                     // Temporary object key to confirm
}

export interface SocialActionResponse {
  liked?: boolean;
  reposted?: boolean;
  bookmarked?: boolean;
  following?: boolean;
  quoteId?: string;
  userId?: string;
}

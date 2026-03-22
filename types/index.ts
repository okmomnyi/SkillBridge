// Core Type Definitions for SkillBridge Mobile App

// ============================================================================
// User Types
// ============================================================================

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  university: string;
  major: string;
  year: number;
  bio: string;
  skillsToTeach: string[];
  skillsToLearn: string[];
  interests: string[];
  availability?: string; // e.g., "Mon-Fri 2-5pm, Weekends flexible"
  rating: number;
  reviewCount: number;
  sessionsCompleted: number;
  points: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Skill Post Types
// ============================================================================

export type SkillCategory = 
  | 'programming'
  | 'design'
  | 'languages'
  | 'music'
  | 'sports'
  | 'cooking'
  | 'academic'
  | 'other';

export interface SkillPost {
  id: string;
  userId: string;
  type: 'teach' | 'learn';
  title: string;
  description: string;
  category: SkillCategory;
  skills: string[];
  level: 'beginner' | 'intermediate' | 'advanced';
  availability: string;
  format: 'in-person' | 'online' | 'both';
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  viewCount: number;
  matchCount: number;
}

// ============================================================================
// Matching Types
// ============================================================================

export interface MatchScore {
  userId: string;
  postId: string;
  score: number;
  breakdown: {
    skillOverlap: number;
    mutualExchange: number;
    categoryAlignment: number;
    rating: number;
    activity: number;
    recency: number;
  };
}

// ============================================================================
// Conversation and Message Types
// ============================================================================

export interface Conversation {
  id: string;
  participants: string[];
  participantDetails: {
    [userId: string]: {
      displayName: string;
      photoURL: string | null;
      lastRead: Date;
    };
  };
  lastMessage: {
    text: string;
    senderId: string;
    timestamp: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  timestamp: Date;
  read: boolean;
  type: 'text' | 'system';
}

// ============================================================================
// Review Types
// ============================================================================

export interface Review {
  id: string;
  reviewerId: string;
  revieweeId: string;
  sessionId: string;
  rating: number;
  comment: string;
  skills: string[];
  createdAt: Date;
}

// ============================================================================
// Session Types
// ============================================================================

export interface Session {
  id: string;
  participants: string[];
  skillPostId: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  scheduledAt: Date;
  completedAt: Date | null;
  createdAt: Date;
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: {
    [field: string]: string;
  };
}

// ============================================================================
// Navigation Types
// ============================================================================

export type RootStackParamList = {
  '(auth)/splash': undefined;
  '(auth)/login': undefined;
  '(auth)/register': undefined;
  '(tabs)': undefined;
};

export type TabsParamList = {
  'home': undefined;
  'search': undefined;
  'create': undefined;
  'messages': undefined;
  'profile': undefined;
};

export type HomeStackParamList = {
  'index': undefined;
  'skill/[id]': { id: string };
};

export type MessagesStackParamList = {
  'index': undefined;
  'chat/[id]': { id: string; participantName: string };
};

export type ProfileStackParamList = {
  'index': undefined;
  'leaderboard': undefined;
};

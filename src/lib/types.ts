
export interface NeuralNodeData {
  id: string;
  title: string;
  type: 'note' | 'link' | 'file' | 'image' | 'project';
  content?: string;
  connections: string[];
  size?: number;
  x?: number;
  y?: number;
  color?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed';
}

export interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  description?: string;
  links?: {
    title: string;
    url: string;
  }[];
  projects?: Project[];
}

export interface ImportSource {
  id: string;
  name: string;
  type: 'csv' | 'api' | 'url' | 'file' | 'text';
  icon: string;
  description: string;
}

// Province related types
export interface Province {
  id: string;
  name: string;
  code: number;
  divisionType: string;
  codename: string;
  phoneCode: number;
}

// Trip related types
export interface Trip {
  id: string;
  title: string;
  provinceId?: string;
  province?: Province;
  startDate?: string;
  description?: string;
  avatar?: string;
  userId: string;
  shareToken?: string;
  isPublic?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTripRequest {
  title: string;
  provinceId?: string;
  startDate?: string;
  description?: string;
}

export interface Day {
  id: string;
  title: string;
  date: string;
  startTime?: string;
  tripId: string;
  description?: string;
}

export interface CreateDayRequest {
  title: string;
  description?: string;
  date: string;
  startTime?: string;
  tripId: string;
}

export interface Activity {
  id: string;
  title: string;
  startTime?: string;
  durationMin?: number;
  location?: string;
  notes?: string;
  important: boolean;
  dayId: string;
}

export interface CreateActivityRequest {
  title: string;
  startTime?: string;
  durationMin?: number;
  location?: string;
  notes?: string;
  important?: boolean;
  dayId: string;
}

export interface UpdateActivityRequest {
  title?: string;
  startTime?: string;
  durationMin?: number;
  location?: string;
  notes?: string;
  important?: boolean;
  dayId?: string;
}

// Trip Members types
export interface TripMember {
  id: string;
  userId: string;
  tripId: string;
  role?: string;
  status?: 'pending' | 'accepted';
  joinedAt: string;
  user: {
    id: string;
    email: string;
    fullName?: string;
    profilePicture?: string;
  };
  trip?: {
    id: string;
    title: string;
    provinceId?: string;
    province?: Province;
    startDate?: string;
  };
}

export interface AddMemberRequest {
  email: string;
  role?: 'member' | 'admin';
}

// Share Link types
export interface ShareLink {
  shareToken: string;
  shareLink: string;
  tripId: string;
}

export interface JoinTripRequest {
  shareToken: string;
}

// This file defines the types used by the API client

export namespace DATABASE_TYPES {
  export interface trips {
    id: string;
    title: string;
    provinceId?: string;
    province?: {
      id: string;
      name: string;
      code: number;
      divisionType: string;
      codename: string;
      phoneCode: number;
    };
    startDate?: string;
    description?: string;
    avatar?: string;
    userId: string;
    isPublic?: boolean;
    shareToken?: string;
    days?: {
      id: string;
      title: string;
      date: string;
      startTime: string | null;
      tripId: string;
      activities?: {
        id: string;
        title: string;
        startTime: string | null;
        durationMin: number;
        location: string;
        notes: string;
        important: boolean;
        dayId: string;
        pinned?: boolean;
      }[];
    }[];
  }

  export interface days {
    id: string;
    created_at: string;
    date: string;
    order_index: number;
    start_time: string | null;
    title: string;
    trip_id: string;
  }


  export interface activities {
    id: string;
    created_at: string;
    day_id: string;
    duration_min: number | null;
    location: string | null;
    notes: string | null;
    pinned: boolean | null;
    tags: string[] | null;
    time_start: string | null;
    title: string;
    images?: activity_images[];
  }

  export interface activity_images {
    id: string;
    url: string;
    activityId: string;
    createdAt: string;
  }

  export interface members {
    id: string;
    role: string;
    status?: string;
    joinedAt: string;
    createdAt: string;
    updatedAt: string;
    userId: string;
    tripId: string;
    user: {
      id: string;
      email: string;
      fullName: string;
      profilePicture?: string;
    };
  }

  export interface expenses {
    id: string;
    title: string;
    amount: number;
    date: string;
    description?: string;
    isLocked?: boolean;
    tripId: string;
    payerId: string;
    participantIds: string[];
    createdAt: string;
    updatedAt: string;
    payer?: {
      id: string;
      email: string;
      fullName: string;
    };
    participants?: {
      id: string;
      user: {
        id: string;
        email: string;
        fullName: string;
      };
      amount?: number;
    }[];
  }

  export interface users {
    id: string;
    email: string;
    created_at: string;
  }

  export interface tripTemplates {
    id: string;
    title: string;
    description?: string;
    avatar?: string;
    provinceId?: string;
    province?: {
      id: string;
      name: string;
      code: number;
      divisionType: string;
      codename: string;
      phoneCode: number;
    };
    isPublic: boolean;
    fee?: string;
    createdAt: string;
    updatedAt: string;
    userId: string;
    user?: {
      id: string;
      email: string;
      fullName: string;
      profilePicture?: string;
    };
    days?: {
      id: string;
      title: string;
      description?: string;
      dayOrder: number;
      tripTemplateId: string;
      activities?: {
        id: string;
        title: string;
        startTime?: string;
        durationMin?: number;
        location?: string;
        notes?: string;
        important: boolean;
        activityOrder: number;
        dayId: string;
      }[];
    }[];
  }

  export interface provinces {
    id: string;
    name: string;
    code: number;
    divisionType: string;
    codename: string;
    phoneCode: number;
    createdAt: string;
    updatedAt: string;
  }
}

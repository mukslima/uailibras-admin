export type Role = "ADMIN" | "AUTHOR" | "REVIEWER";
export type NewsStatus = "DRAFT" | "IN_REVIEW" | "REJECTED" | "APPROVED" | "PUBLISHED" | "ARCHIVED";

export type User = {
  id: string;
  username: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Tag = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
};

export type Media = {
  id: string;
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
  width?: number | null;
  height?: number | null;
  createdAt: string;
};

export type NewsReview = {
  id: string;
  action: "APPROVED" | "REJECTED";
  comment?: string | null;
  createdAt: string;
  reviewer: User;
};

export type News = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  status: NewsStatus;
  authorId: string;
  approvedById?: string | null;
  publishedById?: string | null;
  primaryCategoryId?: string | null;
  coverImageId?: string | null;
  requestedFeaturedPosition?: 1 | 2 | null;
  featuredPosition?: 1 | 2 | 3 | null;
  publishedAt?: string | null;
  revisionOfId?: string | null;
  createdAt: string;
  updatedAt: string;
  author: User;
  approvedBy?: User | null;
  publishedBy?: User | null;
  primaryCategory?: Category | null;
  coverImage?: Media | null;
  categories: Array<{ category: Category }>;
  tags: Array<{ tag: Tag }>;
  media: Array<{ media: Media }>;
  reviews: NewsReview[];
};

export type Paginated<T> = {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type NewsPayload = {
  title: string;
  summary: string;
  content: string;
  primaryCategoryId: string;
  categoryIds: string[];
  tagIds: string[];
  tags: string[];
  coverImageId?: string | null;
  requestedFeaturedPosition?: 1 | 2 | null;
  mediaIds: string[];
};

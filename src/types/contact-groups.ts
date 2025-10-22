// ============================================================================
// Contact Groups and Tags Type Definitions
// ============================================================================

export interface ContactGroup {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  color: string;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactGroupWithCount extends ContactGroup {
  memberCount: number;
}

export interface ContactGroupMember {
  id: string;
  groupId: string;
  contactId: string;
  addedAt: Date;
}

export interface ContactTag {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: Date;
}

export interface ContactTagWithCount extends ContactTag {
  usageCount: number;
}

export interface ContactTagAssignment {
  id: string;
  contactId: string;
  tagId: string;
  assignedAt: Date;
}

// Extended contact type with groups and tags
export interface ContactWithGroupsAndTags {
  id: string;
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  nickname?: string | null;
  company?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  birthday?: Date | null;
  notes?: string | null;
  avatarUrl?: string | null;
  avatarProvider?: string | null;
  sourceType?: string;
  sourceProvider?: string | null;
  sourceId?: string | null;
  isFavorite: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastContactedAt?: Date | null;
  groups: ContactGroup[];
  tags: ContactTag[];
  emails?: Array<{
    id: string;
    email: string;
    type: string;
    isPrimary: boolean;
  }>;
  phones?: Array<{
    id: string;
    phone: string;
    type: string;
    isPrimary: boolean;
  }>;
}

// API Request/Response types
export interface CreateGroupRequest {
  name: string;
  description?: string;
  color?: string;
  isFavorite?: boolean;
  memberIds?: string[]; // Initial members to add
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
  color?: string;
  isFavorite?: boolean;
}

export interface AddMembersRequest {
  contactIds: string[];
}

export interface RemoveMembersRequest {
  contactIds: string[];
}

export interface CreateTagRequest {
  name: string;
  color?: string;
}

export interface UpdateTagRequest {
  name?: string;
  color?: string;
}

export interface AssignTagsRequest {
  tagIds: string[];
}

export interface RemoveTagsRequest {
  tagIds: string[];
}

export interface BulkActionRequest {
  action:
    | 'add-to-group'
    | 'remove-from-group'
    | 'add-tags'
    | 'remove-tags'
    | 'delete';
  contactIds: string[];
  groupId?: string;
  tagIds?: string[];
}

export interface BulkActionResponse {
  success: boolean;
  affectedCount: number;
  errors?: Array<{
    contactId: string;
    error: string;
  }>;
}

// Filter types for contact queries
export interface ContactFilters {
  groupId?: string;
  tagIds?: string[];
  isFavorite?: boolean;
  isArchived?: boolean;
  search?: string;
  sortBy?: 'name_asc' | 'name_desc' | 'recent' | 'company';
  page?: number;
  perPage?: number;
}


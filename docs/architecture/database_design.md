# Database Design & Architecture
## Phase 3 Deliverable

---

## 1. Entity-Relationship Diagram (ERD)

This diagram outlines the relationships between the core entities required for the Image Upload & Share platform.

```mermaid
erDiagram
    Users ||--o{ Images : uploads
    Users ||--o{ Sessions : has
    Users ||--o{ ApiKeys : generates
    Users ||--o{ AuditLogs : actions
    
    Images ||--o{ ImageViews : tracks
    Images ||--o{ AuditLogs : references
    
    Users {
        string id PK
        string email UK
        string name
        int storageUsed "Tracks total bytes uploaded"
        string tier "FREE, PREMIUM"
        datetime createdAt
        datetime updatedAt
    }
    
    Images {
        string id PK
        string userId FK "Nullable for anonymous uploads"
        string url "CDN URL"
        string deleteToken "For anonymous deletion"
        string mimeType
        int size
        int width
        int height
        boolean isPublic
        datetime createdAt
    }
    
    Sessions {
        string id PK
        string userId FK
        string sessionToken UK
        datetime expires
    }
    
    ApiKeys {
        string id PK
        string userId FK
        string name
        string keyHash UK "SHA-256 hashed key"
        string keyPrefix "For display: aura_live_abcd..."
        datetime lastUsedAt
        datetime createdAt
    }
    
    ImageViews {
        string id PK
        string imageId FK
        string ipHash "Hashed for privacy"
        string userAgent
        string country
        datetime viewedAt
    }
    
    AuditLogs {
        string id PK
        string userId FK
        string action "e.g., IMAGE_DELETED, API_KEY_CREATED"
        string entityId "e.g., Image ID or API Key ID"
        json metadata
        datetime createdAt
    }
```

---

## 2. Table Structures & SQL Design

We will use **PostgreSQL (hosted on Supabase)** as the primary relational database. The schema is designed for high concurrency, with careful attention paid to index selection for fast lookups.

### 2.1 Users
* **Primary Key**: `id` (UUID)
* **Unique Constraints**: `email`
* **Indexes**: None specifically required beyond PK/UK.

### 2.2 Images
* **Primary Key**: `id` (CUID or Nanoid for short URL-friendly IDs like `x9f2k3`)
* **Foreign Key**: `userId` (References `Users(id)`, ON DELETE SET NULL)
* **Indexes**: 
  - `idx_images_user_id_created_at` (Speeds up dashboard queries and sorting by date).
  - `idx_images_delete_token` (Fast lookup for anonymous deletions).

### 2.3 ApiKeys
* **Primary Key**: `id` (UUID)
* **Foreign Key**: `userId` (References `Users(id)`, ON DELETE CASCADE)
* **Unique Constraints**: `keyHash`
* **Indexes**: 
  - `idx_api_keys_key_hash` (Critical for authenticating incoming API requests instantly).

### 2.4 ImageViews (Analytics)
* **Primary Key**: `id` (UUID)
* **Foreign Key**: `imageId` (References `Images(id)`, ON DELETE CASCADE)
* **Indexes**: 
  - `idx_image_views_image_id_viewed_at` (For generating time-series graphs of views per image).

### 2.5 AuditLogs
* **Primary Key**: `id` (UUID)
* **Foreign Key**: `userId` (References `Users(id)`)
* **Indexes**:
  - `idx_audit_logs_user_id_action` (For filtering user history).

---

## 3. Storage Quota Mechanism (Optimization)
Instead of running an expensive `SUM(size) FROM Images WHERE userId = ?` every time a user wants to upload an image, we maintain a `storageUsed` integer column on the `Users` table. 
* **Upload**: `UPDATE Users SET storageUsed = storageUsed + new_image_size WHERE id = ?`
* **Delete**: `UPDATE Users SET storageUsed = storageUsed - deleted_image_size WHERE id = ?`

---

## 4. Migration Plan

1. **Initial Migration (`001_init`)**: Create `Users` and `Sessions` tables for Auth.js integration.
2. **Core Domain Migration (`002_images`)**: Create `Images` table with its foreign keys and custom short ID generation.
3. **Analytics Migration (`003_analytics`)**: Create `ImageViews` and `AuditLogs` for tracking and security.
4. **Developer Tools Migration (`004_api_keys`)**: Create `ApiKeys` table.

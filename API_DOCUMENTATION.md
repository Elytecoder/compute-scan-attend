# Computing Society Attendance Monitoring System - API Documentation

## Base URL
```
https://lojxwobotbkwwiccxnwk.supabase.co/rest/v1
```

## Authentication

### Step-by-Step: How to Test in Postman

1. **Import the Collection:**
   - Import `postman_collection.json` into Postman

2. **CRITICAL: Set Up Required Headers**
   
   Every REST API request needs TWO headers:
   ```
   Authorization: Bearer {{access_token}}
   apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxvanh3b2JvdGJrd3dpY2N4bndrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MTU3ODcsImV4cCI6MjA3NDk5MTc4N30.I44Mmo3bWgVugskLf4XTLkZ6tPQYOApyTxQyCVBOiN4
   ```
   
   **These should be auto-configured in the collection**, but verify they're there!

3. **Sign In to Get Your Access Token:**
   - Go to "Authentication > Sign In" request
   - Click **Send**
   - Copy the `access_token` from the response (starts with `eyJ...`)
   - **Manually set** the collection variable:
     - Click collection name → Variables tab
     - Set `access_token` to the value you copied
     - Click **Save**

4. **Test Any Endpoint:**
   - Try "Members > Get All Members"
   - Should return 858 members (not an empty array!)

**Why You're Getting Empty Array `[]`:**
- ✅ Status 200 = API is reachable
- ❌ Empty array = **RLS policies blocked you** because authentication failed
- **Root Cause**: Missing or expired `access_token` in Authorization header
- **Fix**: Complete step 3 above and make sure BOTH headers are present in every request

### Your Test Account
- **Email**: ely.gojar@sorsu.edu.ph
- **Password**: danielely
- **Role**: Admin (full CRUD permissions)

### Required Headers
All endpoints require these headers:
```
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxvanh3b2JvdGJrd3dpY2N4bndrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MTU3ODcsImV4cCI6MjA3NDk5MTc4N30.I44Mmo3bWgVugskLf4XTLkZ6tPQYOApyTxQyCVBOiN4
Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

## API Endpoints

### Authentication Endpoints

#### 1. Sign Up
- **Method:** `POST`
- **URL:** `https://lojxwobotbkwwiccxnwk.supabase.co/auth/v1/signup`
- **Description:** Register a new user account
- **Headers:**
  ```
  apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxvanh3b2JvdGJrd3dpY2N4bndrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MTU3ODcsImV4cCI6MjA3NDk5MTc4N30.I44Mmo3bWgVugskLf4XTLkZ6tPQYOApyTxQyCVBOiN4
  Content-Type: application/json
  ```
- **Request Body:**
  ```json
  {
    "email": "newuser@sorsu.edu.ph",
    "password": "SecurePassword123!"
  }
  ```

#### 2. Sign In (⭐ START HERE)
- **Method:** `POST`
- **URL:** `https://lojxwobotbkwwiccxnwk.supabase.co/auth/v1/token?grant_type=password`
- **Description:** Authenticate and get access token
- **Headers:**
  ```
  apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxvanh3b2JvdGJrd3dpY2N4bndrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MTU3ODcsImV4cCI6MjA3NDk5MTc4N30.I44Mmo3bWgVugskLf4XTLkZ6tPQYOApyTxQyCVBOiN4
  Content-Type: application/json
  ```
- **Request Body:**
  ```json
  {
    "email": "ely.gojar@sorsu.edu.ph",
    "password": "danielely"
  }
  ```
- **Response (contains your access token):**
  ```json
  {
    "access_token": "eyJhbGc...",
    "token_type": "bearer",
    "expires_in": 3600,
    "user": {
      "id": "49d3d55f-f2e3-4225-9603-f8f3b24eb049",
      "email": "ely.gojar@sorsu.edu.ph"
    }
  }
  ```

---

### Members Endpoints

#### 3. Get All Members
- **Method:** `GET`
- **URL:** `/members`
- **Description:** Retrieve all registered members
- **Headers:**
  ```
  apikey: YOUR_ANON_KEY
  Authorization: Bearer YOUR_ACCESS_TOKEN
  ```
- **Sample Response:**
  ```json
  [
    {
      "id": "uuid",
      "school_id": "2021-00001",
      "name": "Juan Dela Cruz",
      "program": "BSCS",
      "year_level": 4,
      "block": "A",
      "created_at": "2025-10-23T12:00:00Z"
    }
  ]
  ```

#### 4. Get Member by ID
- **Method:** `GET`
- **URL:** `/members?id=eq.{uuid}`
- **Description:** Retrieve a specific member
- **Headers:**
  ```
  apikey: YOUR_ANON_KEY
  Authorization: Bearer YOUR_ACCESS_TOKEN
  ```

#### 5. Create Member
- **Method:** `POST`
- **URL:** `/members`
- **Description:** Add a new member
- **Headers:**
  ```
  apikey: YOUR_ANON_KEY
  Authorization: Bearer YOUR_ACCESS_TOKEN
  Content-Type: application/json
  Prefer: return=representation
  ```
- **Request Body:**
  ```json
  {
    "school_id": "2023-00010",
    "name": "Carlos Lopez",
    "program": "BSCS",
    "year_level": 1,
    "block": "A"
  }
  ```

#### 6. Update Member
- **Method:** `PATCH`
- **URL:** `/members?id=eq.{uuid}`
- **Description:** Update member information
- **Headers:**
  ```
  apikey: YOUR_ANON_KEY
  Authorization: Bearer YOUR_ACCESS_TOKEN
  Content-Type: application/json
  Prefer: return=representation
  ```
- **Request Body:**
  ```json
  {
    "year_level": 2,
    "block": "B"
  }
  ```

#### 7. Delete Member
- **Method:** `DELETE`
- **URL:** `/members?id=eq.{uuid}`
- **Description:** Delete a member (Admin only)
- **Headers:**
  ```
  apikey: YOUR_ANON_KEY
  Authorization: Bearer YOUR_ACCESS_TOKEN
  ```

---

### Events Endpoints

#### 8. Get All Events
- **Method:** `GET`
- **URL:** `/events`
- **Description:** Retrieve all events
- **Headers:**
  ```
  apikey: YOUR_ANON_KEY
  Authorization: Bearer YOUR_ACCESS_TOKEN
  ```
- **Sample Response:**
  ```json
  [
    {
      "id": "uuid",
      "name": "Computing Society General Assembly",
      "description": "Monthly general assembly meeting",
      "event_date": "2025-11-01",
      "created_by": "uuid",
      "created_at": "2025-10-23T12:00:00Z"
    }
  ]
  ```

#### 9. Get Event by ID
- **Method:** `GET`
- **URL:** `/events?id=eq.{uuid}`
- **Description:** Retrieve a specific event
- **Headers:**
  ```
  apikey: YOUR_ANON_KEY
  Authorization: Bearer YOUR_ACCESS_TOKEN
  ```

#### 10. Create Event
- **Method:** `POST`
- **URL:** `/events`
- **Description:** Create a new event
- **Headers:**
  ```
  apikey: YOUR_ANON_KEY
  Authorization: Bearer YOUR_ACCESS_TOKEN
  Content-Type: application/json
  Prefer: return=representation
  ```
- **Request Body:**
  ```json
  {
    "name": "Python Workshop",
    "description": "Hands-on Python programming workshop",
    "event_date": "2025-11-20"
  }
  ```

#### 11. Update Event
- **Method:** `PATCH`
- **URL:** `/events?id=eq.{uuid}`
- **Description:** Update event details
- **Headers:**
  ```
  apikey: YOUR_ANON_KEY
  Authorization: Bearer YOUR_ACCESS_TOKEN
  Content-Type: application/json
  Prefer: return=representation
  ```
- **Request Body:**
  ```json
  {
    "description": "Updated workshop description",
    "event_date": "2025-11-22"
  }
  ```

#### 12. Delete Event
- **Method:** `DELETE`
- **URL:** `/events?id=eq.{uuid}`
- **Description:** Delete an event (Admin only)
- **Headers:**
  ```
  apikey: YOUR_ANON_KEY
  Authorization: Bearer YOUR_ACCESS_TOKEN
  ```

---

### Attendance Endpoints

#### 13. Get All Attendance Records
- **Method:** `GET`
- **URL:** `/attendance?select=*,members(*),events(*)`
- **Description:** Retrieve all attendance with member and event details
- **Headers:**
  ```
  apikey: YOUR_ANON_KEY
  Authorization: Bearer YOUR_ACCESS_TOKEN
  ```
- **Sample Response:**
  ```json
  [
    {
      "id": "uuid",
      "member_id": "uuid",
      "event_id": "uuid",
      "time_in": "2025-11-01T09:00:00Z",
      "time_out": "2025-11-01T12:00:00Z",
      "session": "morning",
      "created_at": "2025-11-01T09:00:00Z",
      "members": {
        "name": "Juan Dela Cruz",
        "school_id": "2021-00001"
      },
      "events": {
        "name": "Computing Society General Assembly"
      }
    }
  ]
  ```

#### 14. Get Attendance by Event
- **Method:** `GET`
- **URL:** `/attendance?event_id=eq.{uuid}&select=*,members(*)`
- **Description:** Get attendance for a specific event
- **Headers:**
  ```
  apikey: YOUR_ANON_KEY
  Authorization: Bearer YOUR_ACCESS_TOKEN
  ```

#### 15. Record Attendance (Check-in)
- **Method:** `POST`
- **URL:** `/attendance`
- **Description:** Record member attendance for an event
- **Headers:**
  ```
  apikey: YOUR_ANON_KEY
  Authorization: Bearer YOUR_ACCESS_TOKEN
  Content-Type: application/json
  Prefer: return=representation
  ```
- **Request Body:**
  ```json
  {
    "member_id": "member-uuid-here",
    "event_id": "event-uuid-here",
    "session": "morning"
  }
  ```

#### 16. Update Attendance (Check-out)
- **Method:** `PATCH`
- **URL:** `/attendance?id=eq.{uuid}`
- **Description:** Update attendance record with time_out
- **Headers:**
  ```
  apikey: YOUR_ANON_KEY
  Authorization: Bearer YOUR_ACCESS_TOKEN
  Content-Type: application/json
  Prefer: return=representation
  ```
- **Request Body:**
  ```json
  {
    "time_out": "2025-11-01T12:00:00Z"
  }
  ```

#### 17. Delete Attendance
- **Method:** `DELETE`
- **URL:** `/attendance?id=eq.{uuid}`
- **Description:** Delete an attendance record (Admin only)
- **Headers:**
  ```
  apikey: YOUR_ANON_KEY
  Authorization: Bearer YOUR_ACCESS_TOKEN
  ```

---

### User Profiles Endpoints

#### 18. Get User Profile
- **Method:** `GET`
- **URL:** `/profiles?user_id=eq.{uuid}`
- **Description:** Retrieve user profile information
- **Headers:**
  ```
  apikey: YOUR_ANON_KEY
  Authorization: Bearer YOUR_ACCESS_TOKEN
  ```

#### 19. Update User Profile
- **Method:** `PATCH`
- **URL:** `/profiles?user_id=eq.{uuid}`
- **Description:** Update user profile
- **Headers:**
  ```
  apikey: YOUR_ANON_KEY
  Authorization: Bearer YOUR_ACCESS_TOKEN
  Content-Type: application/json
  Prefer: return=representation
  ```
- **Request Body:**
  ```json
  {
    "full_name": "Updated Name"
  }
  ```

---

## Environment Variables

```env
# Supabase Configuration (DO NOT COMMIT ACTUAL VALUES)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
VITE_SUPABASE_PROJECT_ID=your-project-id
```

---

## Query Parameters & Filters

Supabase REST API supports powerful filtering:

- **Equality:** `?column=eq.value`
- **Greater than:** `?column=gt.value`
- **Less than:** `?column=lt.value`
- **Like:** `?column=like.*pattern*`
- **In:** `?column=in.(value1,value2)`
- **Order:** `?order=column.asc` or `?order=column.desc`
- **Limit:** `?limit=10`
- **Select specific columns:** `?select=id,name,email`

Example:
```
GET /members?program=eq.BSCS&year_level=gte.3&order=name.asc&limit=10
```

---

## Error Responses

**401 Unauthorized:**
```json
{
  "message": "Invalid API key or access token"
}
```

**403 Forbidden:**
```json
{
  "message": "Insufficient permissions"
}
```

**404 Not Found:**
```json
{
  "message": "Resource not found"
}
```

**500 Internal Server Error:**
```json
{
  "message": "Internal server error"
}
```

---

## Testing with Postman

1. Import the `postman_collection.json` file
2. Set up environment variables:
   - `base_url`: https://lojxwobotbkwwiccxnwk.supabase.co
   - `anon_key`: Your anon key
   - `access_token`: Obtained from Sign In endpoint
3. Start with Authentication > Sign In to get your access token
4. Use the token for subsequent requests

---

## Notes

- All timestamps are in UTC
- The `session` field in attendance supports: `morning`, `afternoon`, `evening`
- Programs supported: `BSCS`, `BSIT`, `BSIS`, `BTVTED-CSS`
- Only authenticated users with `@sorsu.edu.ph` emails can access the API
- Officers and Admins have different permission levels (enforced via RLS)

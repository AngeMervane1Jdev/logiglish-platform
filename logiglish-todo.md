# Logiglish Platform - Complete Implementation TODO

## 📊 Database Schema Reference

### Tables Created

#### `profiles`
- `id` (UUID, PK, FK to auth.users)
- `email` (TEXT, UNIQUE)
- `full_name` (TEXT)
- `role` (ENUM: 'student', 'instructor', 'admin')
- `subscription_plan` (ENUM: 'basic', 'premium')
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

#### `topics`
- `id` (UUID, PK)
- `title` (TEXT)
- `description` (TEXT)
- `sequence_order` (INTEGER)
- `is_active` (BOOLEAN)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

#### `bookings`
- `id` (UUID, PK)
- `student_id` (UUID, FK to profiles)
- `instructor_id` (UUID, FK to profiles)
- `topic_id` (UUID, FK to topics)
- `lesson_type` (ENUM: 'response_practice', 'micro_response_practice')
- `status` (ENUM: 'pending', 'confirmed', 'completed', 'cancelled')
- `scheduled_at` (TIMESTAMPTZ)
- `calendly_event_id` (TEXT)
- `video_link` (TEXT)
- `notes` (TEXT)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

#### `topic_materials`
- `id` (UUID, PK)
- `topic_id` (UUID, FK to topics)
- `material_type` (TEXT: 'pre_study_pdf', 'assignment', 'feedback', 'audio')
- `title` (TEXT)
- `file_url` (TEXT)
- `message_content` (TEXT)
- `sequence_order` (INTEGER)
- `uploaded_by` (UUID, FK to profiles)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

#### `student_submissions`
- `id` (UUID, PK)
- `student_id` (UUID, FK to profiles)
- `topic_id` (UUID, FK to topics)
- `material_id` (UUID, FK to topic_materials)
- `file_url` (TEXT)
- `submitted_at` (TIMESTAMPTZ)
- `feedback_url` (TEXT)
- `feedback_at` (TIMESTAMPTZ)

#### `messages`
- `id` (UUID, PK)
- `topic_id` (UUID, FK to topics)
- `student_id` (UUID, FK to profiles)
- `author_id` (UUID, FK to profiles)
- `content` (TEXT)
- `created_at` (TIMESTAMPTZ)

### Storage Buckets
- `student-files` (Private)
- `lesson-materials` (Private)
- `public-assets` (Public)

---

## 🎯 FUNCTION 1: Response Practice Booking Screen

### 1.1 Calendly Integration Setup
- [ ] Install Calendly SDK/API client
- [ ] Create Calendly service module (`src/lib/calendly/client.ts`)
- [ ] Set up Calendly API credentials in `.env.local`
- [ ] Create webhook endpoint to receive Calendly events (`/api/webhooks/calendly`)
- [ ] Test connection to Calendly API

### 1.2 Booking Screen UI
- [ ] Create booking page (`src/app/dashboard/book/page.tsx`)
- [ ] Display available time slots from Calendly
- [ ] Show instructor availability in real-time
- [ ] Implement time zone auto-detection and conversion
- [ ] Display lesson type options (30-min Response Practice vs Micro Response Practice)
- [ ] Add plan-based visibility logic (hide Micro Response Practice for basic plans)

### 1.3 Booking Logic & Constraints
- [ ] Implement "one active booking at a time" rule
  - [ ] Check if student has pending/confirmed booking before allowing new booking
  - [ ] Query: `SELECT * FROM bookings WHERE student_id = ? AND status IN ('pending', 'confirmed')`
- [ ] Implement 36-hour booking deadline
  - [ ] Validate booking time is at least 36 hours in future
  - [ ] Display error message if deadline not met
- [ ] Create booking record in `bookings` table when confirmed
- [ ] Store Calendly event ID for reference

### 1.4 Booking Confirmation & Notifications
- [ ] Set up Resend email service (`src/lib/email/client.ts`)
- [ ] Create email templates
  - [ ] Booking confirmation email (student)
  - [ ] Booking confirmation email (instructor/admin)
  - [ ] Booking reminder email (24 hours before)
  - [ ] Booking cancellation email
- [ ] Send automatic confirmation emails on booking
- [ ] Generate calendar invite (.ics file) attachment

### 1.5 Admin Booking Management
- [ ] Create admin booking management page (`src/app/admin/bookings/page.tsx`)
- [ ] Display all bookings in a table/calendar view
- [ ] Add "Modify Booking" functionality
  - [ ] Update `bookings` table
  - [ ] Sync changes with Calendly API
  - [ ] Send notification email
- [ ] Add "Cancel Booking" functionality
  - [ ] Update booking status to 'cancelled'
  - [ ] Cancel Calendly event
  - [ ] Send cancellation email

### 1.6 Learner-Admin Communication
- [ ] Create booking inquiry chat component
- [ ] Add chat icon/button on booking page
- [ ] Implement real-time messaging (Supabase Realtime)
- [ ] Store messages in `messages` table
- [ ] Send email notification to admin when new message received

### 1.7 Booking Completion Flow
- [ ] Mark booking as 'completed' after lesson time passes
- [ ] Unlock ability to book next session
- [ ] Update student progress tracking

---

## 📁 FUNCTION 2: Learner File Management

### 2.1 Topic Structure Setup
- [ ] Create admin topic management page (`src/app/admin/topics/page.tsx`)
- [ ] CRUD operations for topics
  - [ ] Create new topic
  - [ ] Edit topic details
  - [ ] Set topic sequence order
  - [ ] Activate/deactivate topics

### 2.2 Student Topic View
- [ ] Create student topics dashboard (`src/app/dashboard/topics/page.tsx`)
- [ ] Display topics in sequence order
- [ ] Show topic completion status
- [ ] Create topic detail page (`src/app/dashboard/topics/[id]/page.tsx`)
- [ ] Display all 10 steps for each topic

### 2.3 Step 1: Pre-study Sentence Reordering Exercises (PDF)
**Admin Side:**
- [ ] Create PDF upload component for admins
- [ ] Upload PDF to `lesson-materials` bucket
- [ ] Store file URL in `topic_materials` table
  - [ ] `material_type`: 'pre_study_pdf'
  - [ ] `sequence_order`: 1

**Student Side:**
- [ ] Display "Download PDF" button
- [ ] Implement PDF download functionality
- [ ] Track if student has downloaded (optional analytics)

### 2.4 Step 2: First Real Time Response Practice Booking
**Admin Side:**
- [ ] Add "Enable Booking" toggle for this step
- [ ] Configure which booking type (Response Practice)

**Student Side:**
- [ ] Display "Book Lesson" button/link
- [ ] Link to booking screen (Function 1)
- [ ] Show booking status if already booked
- [ ] Display "Booked for [date/time]" when confirmed

### 2.5 Step 3: First Real Time Response Practice Video Chat Link
**Admin Side:**
- [ ] Generate unique Jitsi video link
  - [ ] Format: `https://meet.jit.si/logiglish-{booking_id}`
- [ ] Store video link in `bookings.video_link`
- [ ] Display video link in admin booking view
- [ ] Add message with video link in topic detail

**Student Side:**
- [ ] Display video chat link message
- [ ] Add "Join Video Chat" button
- [ ] Show countdown to lesson time
- [ ] Enable button only 10 minutes before scheduled time

### 2.6 Step 4: English Writing Assignment
**Admin Side:**
- [ ] Create Word document upload component
- [ ] Upload to `lesson-materials` bucket
- [ ] Store in `topic_materials` table
  - [ ] `material_type`: 'assignment'
  - [ ] `sequence_order`: 4

**Student Side:**
- [ ] Display "Download Assignment" button
- [ ] Download Word document

### 2.7 Step 5: Submission of English Writing Assignment
**Admin Side:**
- [ ] View student submissions in admin panel
- [ ] Download submitted files

**Student Side:**
- [ ] Create file upload component
- [ ] Accept Word (.doc, .docx) and PDF files
- [ ] Upload to `student-files/{student_id}/` bucket
- [ ] Store submission in `student_submissions` table
  - [ ] Link to `topic_id` and `material_id`
- [ ] Show submission confirmation
- [ ] Display "Submitted on [date]" status

### 2.8 Step 6: Corrected English Writing (Feedback)
**Admin Side:**
- [ ] Upload corrected PDF
- [ ] Store in `lesson-materials` bucket
- [ ] Update `student_submissions.feedback_url`
- [ ] Set `student_submissions.feedback_at` timestamp
- [ ] Send email notification to student

**Student Side:**
- [ ] Display "Download Feedback" button
- [ ] Show notification badge when feedback is available
- [ ] Download corrected PDF

### 2.9 Step 7: Audio Learning Materials for English Writing
**Admin Side:**
- [ ] Create rich text message component
- [ ] Add YouTube video embed support
- [ ] Store in `topic_materials` table
  - [ ] `material_type`: 'audio'
  - [ ] `message_content`: Contains text + YouTube URLs
  - [ ] `sequence_order`: 7

**Student Side:**
- [ ] Display message with formatting
- [ ] Embed YouTube videos inline
- [ ] Make links clickable

### 2.10 Step 8: Second Real Time Response Practice Booking
- [ ] Same implementation as Step 2
- [ ] Track as separate booking instance
- [ ] Ensure first booking is completed before allowing second

### 2.11 Step 9: Second Real Time Response Practice Video Chat Link
- [ ] Same implementation as Step 3
- [ ] Generate new unique video link
- [ ] Link to second booking

### 2.12 Step 10: Micro Response Practice Booking
**Plan-Based Visibility:**
- [ ] Check `profiles.subscription_plan`
- [ ] Show only if `subscription_plan = 'premium'`
- [ ] Display upgrade message for basic plan users

**Implementation:**
- [ ] Same as Step 2 but with `lesson_type = 'micro_response_practice'`
- [ ] Link to Calendly Micro Response Practice event

### 2.13 Admin Page UI/UX
- [ ] Create comprehensive admin dashboard
- [ ] Display student list with progress
- [ ] Topic management interface
- [ ] File upload/management interface
- [ ] Drag-and-drop file uploads
- [ ] Bulk operations support

### 2.14 Learner Page UI/UX
- [ ] Create clean, intuitive student dashboard
- [ ] Progress indicators for each topic
- [ ] Step-by-step workflow display
- [ ] File download/upload components
- [ ] Responsive design for mobile

---

## 🎥 FUNCTION 3: Integration with Free Video Chat Tools

### 3.1 Jitsi Integration
- [ ] Research Jitsi Meet API
- [ ] Create video link generator utility (`src/lib/video/jitsi.ts`)
- [ ] Generate unique room names per lesson
  - [ ] Format: `logiglish-{booking_id}-{timestamp}`
- [ ] Store video link in `bookings.video_link` on booking creation

### 3.2 Video Link Generation
- [ ] Auto-generate link when booking is confirmed
- [ ] Update link in confirmation email
- [ ] Add to calendar event

### 3.3 Video Link Distribution
**Student Side:**
- [ ] Display video link on dashboard
- [ ] Show on topic detail page (Step 3, 9)
- [ ] Include in booking confirmation email
- [ ] Add to calendar event

**Admin Side:**
- [ ] Display video link in booking management
- [ ] Quick copy link button
- [ ] Open link in new tab

### 3.4 Calendar Synchronization
- [ ] Generate .ics calendar file with video link
- [ ] Attach to confirmation emails
- [ ] Sync with Google Calendar via API (optional)
- [ ] Update calendar events when booking changes

### 3.5 Video Room Security
- [ ] Add password protection to Jitsi rooms (optional)
- [ ] Limit room access time window (e.g., 15 min before to 1 hour after)
- [ ] Generate lobby mode for waiting room

---

## 👨‍🏫 FUNCTION 4: Instructor-Side Operational Flow

### 4.1 Instructor Availability Management
- [ ] Integrate with Calendly instructor calendar
- [ ] Allow instructors to set availability in Calendly
- [ ] Sync availability to application

### 4.2 Booking Notifications for Instructors
- [ ] Send email notification when new booking created
- [ ] Include student info, topic, and video link
- [ ] Calendar invite with all details

### 4.3 Instructor Dashboard
- [ ] Create instructor dashboard (`src/app/instructor/page.tsx`)
- [ ] Display upcoming lessons
- [ ] Show today's schedule
- [ ] Quick access to student files

### 4.4 Learner Profile Access
- [ ] Create student profile page for instructors
- [ ] Display student information
- [ ] Show all topics and progress
- [ ] Access to student submissions
- [ ] Download submitted files

### 4.5 Review Materials Before Lesson
- [ ] Display pre-study PDFs
- [ ] Show student submissions
- [ ] Access to previous feedback
- [ ] View messages/comments from student

### 4.6 Lesson Conduct
- [ ] One-click access to video chat link
- [ ] Display lesson time and countdown
- [ ] Student information sidebar during lesson

### 4.7 Post-Lesson Actions
- [ ] Mark lesson as completed
- [ ] Add brief notes/comments
  - [ ] Store in `bookings.notes`
- [ ] Upload feedback if needed
- [ ] Rate student performance (optional future feature)

### 4.8 Communication Tools
- [ ] Instructor can send messages to students
- [ ] Access to chat history per student
- [ ] Email integration for important updates

---

## 🔧 Additional Technical Implementations

### Authentication & Authorization
- [x] Supabase Auth setup (already done)
- [x] Row Level Security policies (already done)
- [ ] Login page with role-based redirect
- [ ] Signup page with email verification
- [ ] Password reset functionality
- [ ] Protected routes middleware
- [ ] Role-based access control (RBAC) helper functions

### File Upload/Download System
- [ ] Create file upload utility (`src/lib/storage/upload.ts`)
- [ ] Implement file size validation (max 10MB for PDFs, 50MB for videos)
- [ ] File type validation (PDF, DOC, DOCX only)
- [ ] Progress bar for uploads
- [ ] Secure download URLs with expiration
- [ ] Delete file functionality (admin only)

### API Routes
- [ ] `/api/bookings` - CRUD operations
- [ ] `/api/topics` - CRUD operations
- [ ] `/api/materials` - Upload/manage materials
- [ ] `/api/submissions` - Student submissions
- [ ] `/api/messages` - Messaging system
- [ ] `/api/webhooks/calendly` - Calendly webhook handler
- [ ] `/api/email/send` - Email sending
- [ ] `/api/video/generate-link` - Video link generator

### Real-time Features (Supabase Realtime)
- [ ] Live booking updates
- [ ] Real-time messaging
- [ ] Notification system
- [ ] Live status updates for lessons

### Email Templates
- [ ] Booking confirmation template
- [ ] Booking reminder template (24 hours)
- [ ] Booking reminder template (1 hour)
- [ ] Booking cancellation template
- [ ] Assignment feedback available template
- [ ] Welcome email for new students
- [ ] Instructor assignment notification

### UI Components Library
- [ ] Button component
- [ ] Input/Textarea components
- [ ] File upload component
- [ ] Modal/Dialog component
- [ ] Loading spinner
- [ ] Toast notifications
- [ ] Date/time picker
- [ ] Calendar view component
- [ ] Progress bar component
- [ ] Badge/status indicator
- [ ] Table component (for admin views)

### Testing
- [ ] Unit tests for utility functions
- [ ] Integration tests for API routes
- [ ] E2E tests for critical user flows
  - [ ] Student signup → booking → submission flow
  - [ ] Admin upload → student download flow
- [ ] Test booking constraints (36-hour deadline, one active booking)

### Security & Performance
- [ ] Rate limiting on API routes
- [ ] Input sanitization
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Image optimization
- [ ] Code splitting
- [ ] Lazy loading for components
- [ ] Caching strategy (ISR, SWR)

### Deployment & DevOps
- [ ] Set up Vercel project
- [ ] Configure environment variables in Vercel
- [ ] Connect custom domain
- [ ] Set up SSL certificate
- [ ] Configure Supabase production environment
- [ ] Set up error tracking (Sentry)
- [ ] Set up analytics (Google Analytics, Mixpanel)
- [ ] Database backup strategy
- [ ] Monitoring and alerts

### Documentation
- [ ] API documentation
- [ ] Component documentation (Storybook)
- [ ] User guide for students
- [ ] Admin manual
- [ ] Deployment guide
- [ ] Troubleshooting guide

---

## 📅 Suggested Implementation Order

### Week 1: Foundation
1. Authentication system (login, signup, password reset)
2. Basic dashboard layouts (student, admin, instructor)
3. Navigation and routing
4. Database seed data (test topics, users)

### Week 2: Core Features - Topics & Materials
5. Topic management (admin CRUD)
6. Student topic view
7. File upload/download system
8. Step 1-4 implementation (PDF downloads, assignments)

### Week 3: Submissions & Feedback
9. Step 5-7 implementation (submissions, feedback, audio materials)
10. Admin submission review interface
11. Email notification system setup

### Week 4: Booking System
12. Calendly API integration
13. Booking screen implementation
14. Booking constraints and validation
15. Step 2, 8, 10 implementation (booking buttons)

### Week 5: Video & Calendar
16. Jitsi integration
17. Video link generation
18. Step 3, 9 implementation (video links)
19. Calendar event generation

### Week 6: Instructor Features
20. Instructor dashboard
21. Lesson management interface
22. Post-lesson notes/feedback
23. Student profile view for instructors

### Week 7: Polish & Testing
24. Real-time messaging system
25. Notification system
26. Email templates refinement
27. Comprehensive testing

### Week 8: Deployment & Launch
28. Production deployment
29. Security audit
30. Performance optimization
31. User acceptance testing
32. Go live! 🚀

---

## 🎯 Priority Levels

**P0 (Critical - Must Have for MVP):**
- Authentication
- Topic viewing (student)
- Basic file upload/download
- Booking system integration
- Video link generation
- Email notifications

**P1 (High - Important for Launch):**
- Admin topic management
- All 10 steps implementation
- Instructor dashboard
- Plan-based visibility
- Real-time messaging

**P2 (Medium - Nice to Have):**
- Advanced analytics
- Bulk operations
- Calendar sync
- Mobile app optimization
- Performance monitoring

**P3 (Low - Future Enhancements):**
- Student performance tracking
- Automated reminders via SMS
- Multi-language support
- Advanced reporting
- AI-powered features

---

## ✅ Definition of Done

For each feature, consider it complete when:
- [ ] Code is written and tested
- [ ] Unit tests pass
- [ ] Integration with database works
- [ ] UI/UX is responsive and accessible
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Security checked (RLS, validation)
- [ ] Peer reviewed
- [ ] Deployed to staging
- [ ] User tested
- [ ] Documentation updated

---

## 🚨 Known Challenges & Solutions

1. **36-hour booking deadline**: Implement server-side validation + client-side warning
2. **One active booking**: Use database transaction with lock to prevent race conditions
3. **File size limits**: Implement chunked uploads for large files
4. **Real-time sync**: Use Supabase Realtime subscriptions
5. **Calendar sync**: Generate .ics files, consider Google Calendar API for advanced features
6. **Timezone handling**: Use `Intl.DateTimeFormat` and store all times in UTC

---

## 📞 External Service Setup Checklist

- [ ] Supabase project created and configured
- [ ] Calendly account with API access
- [ ] Resend account for emails
- [ ] Stripe account (for future payments)
- [ ] Domain purchased and configured
- [ ] Google Workspace or similar for corporate email
- [ ] GitHub repository created
- [ ] Vercel account connected to GitHub

---

**Last Updated**: [Current Date]
**Project Status**: 🟡 In Development
**Estimated Completion**: 8 weeks from start
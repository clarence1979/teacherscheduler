# Teacher Scheduler AI

An intelligent teaching assistant that helps educators optimize their schedules, manage tasks, and automate workflows using AI-powered employees.

## Features

### 🧠 AI-Powered Scheduling
- Automatic task optimization based on priority, deadlines, and preferences
- Real-time schedule adjustments when disruptions occur
- Happiness algorithm that balances workload and well-being

### 🤖 Specialized AI Employees
- **Ms. Planner**: Lesson planning and curriculum alignment
- **Dr. Gradebook**: Assessment creation and grading assistance
- **Mrs. Connect**: Parent communication and conference preparation
- **Coach Wilson**: Classroom management and behavior strategies
- **Ms. Inclusion**: Special education support and accommodations
- **Dr. Growth**: Professional development and reflection tools
- **Tech Wizard**: Technology integration and digital projects
- **Mr. Ready**: Substitute teacher plans and emergency activities

### 📅 Smart Calendar Integration
- Google Calendar SSO with automatic token management
- Bi-directional sync with external calendars
- Meeting scheduler with booking links and buffer management

### 📊 Advanced Analytics
- Productivity tracking and insights
- Time distribution analysis
- Trend visualization and recommendations

## Quick Start

### 1. Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
# Supabase (required for data storage)
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Google OAuth (optional, for SSO and calendar integration)
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# OpenAI API (optional, can be set in app)
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

### 2. Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the migrations in `/supabase/migrations/` to set up the database schema
3. Update your `.env` file with the Supabase URL and anon key

### 3. Google OAuth Setup (Optional)

For Google SSO and automatic calendar integration:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Calendar API and Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set authorized redirect URIs to: `https://your-domain.com/auth/google/callback`
6. Copy Client ID and Client Secret to your `.env` file

### 4. Microsoft OAuth Setup (Optional)

For Microsoft SSO and automatic Outlook Calendar integration:

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to "Azure Active Directory" → "App registrations"
3. Click "New registration"
4. Set redirect URI to: `https://your-domain.com/auth/microsoft/callback`
5. Go to "API permissions" → "Add a permission" → "Microsoft Graph"
6. Add these permissions:
   - `Calendars.ReadWrite` (Delegated)
   - `Calendars.Read` (Delegated)
   - `User.Read` (Delegated)
7. Go to "Certificates & secrets" → "New client secret"
8. Copy Application (client) ID and client secret to your `.env` file

### 5. OpenAI API Setup (Optional)

For real AI responses instead of simulations:

1. Get an API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Either add it to your `.env` file or configure it in the app settings

### 6. Run the Application

```bash
npm install
npm run dev
```

## Usage

### Getting Started
1. **Sign up/Sign in** - Create an account or use Google SSO
2. **Add tasks** - Use the task form to add your teaching tasks
3. **Let AI optimize** - The system automatically creates an optimal schedule
4. **Connect calendar** - Link your Google Calendar for seamless integration
5. **Use AI employees** - Assign workflows to specialized AI assistants

### SSO Authentication Options

**Google SSO:**
- Automatic Google Calendar integration
- Gmail-based authentication
- Seamless Google Workspace integration

**Microsoft SSO:**
- Automatic Outlook Calendar integration
- Azure AD authentication
- Enterprise Office 365 integration
- Automatic tenant detection

Both SSO options automatically:
- Retrieve calendar access tokens
- Set up calendar synchronization
- Handle token refresh
- Provide seamless user experience

### AI Employee Workflows

Each AI employee specializes in different teaching tasks:

- **Lesson Planning**: Create detailed lesson plans, unit plans, and learning objectives
- **Assessment**: Generate rubrics, quiz questions, and student feedback
- **Parent Communication**: Draft professional emails and conference notes
- **Behavior Management**: Create intervention plans and engagement strategies
- **Special Education**: Develop accommodations and inclusive practices
- **Professional Development**: Reflection questions and growth planning
- **Technology**: Integration strategies and digital projects
- **Substitute Planning**: Emergency plans and backup activities

### Calendar Integration

With SSO enabled (Google or Microsoft):
- Automatic calendar access after login
- No manual credential configuration needed
- Real-time sync with Google Calendar
- Real-time sync with Google Calendar or Outlook
- Smart meeting scheduling with buffer times
- Automatic token refresh and management
- Enterprise-grade security

## Architecture

### Core Components
- **Happiness Algorithm**: Multi-factor optimization engine
- **Real-Time Optimizer**: Dynamic rescheduling system
- **AI Employee Manager**: Workflow automation system
- **Calendar Integration**: External calendar sync
- **Analytics Manager**: Productivity insights and reporting

### Database Schema
- **Users & Profiles**: User management and preferences
- **Tasks & Projects**: Task organization and dependencies
- **Workspaces**: Project grouping and collaboration
- **Events & Meetings**: Calendar integration and scheduling
- **AI Workflows**: Automation tracking and results

## Security

- Row Level Security (RLS) enabled on all tables
- OAuth2 authentication with Google
- Local storage for sensitive tokens
- API keys never sent to our servers
- Secure token refresh mechanisms

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues or questions:
- Check the documentation
- Review the code comments
- Open an issue on GitHub

## License

MIT License - see LICENSE file for details.
# ⚽ TrackerU — Soccer Player Development Platform

> A comprehensive player development tracking platform for soccer coaches, built as a front-end-only web app powered by [Supabase](https://supabase.com).

**Live site:** [trackeru.app](https://trackeru.app)

---

## Overview

TrackerU gives soccer coaches a powerful, privacy-first tool to track player development across four core performance areas. Players access their own profiles using a unique 5-character code — no personal information or login required on the player side.

---

## Features

| Feature | Description |
|---|---|
| 📊 **Performance Tracking** | Rate players across Technical, Mentality, Soccer Intelligence, and Athleticism metrics |
| 🔒 **Player Privacy** | Players identify themselves with a secure 5-letter code — no names exposed publicly |
| 🎬 **Video Library** | Assign YouTube or Vimeo training videos directly to individual players |
| 💬 **Coaching Comments** | Attach detailed written feedback to every individual metric |
| 🏆 **Rewards & Leaderboard** | Gamified badge system with a sortable team leaderboard |
| 📱 **Player Profiles** | Players view their own metrics, rating history, assigned videos, and goals |
| ⚙️ **Admin Dashboard** | Full coach interface to add players, update metrics, and manage training content |

---

## Player Development Areas

### ⚡ Technical Skills
- Ball Control (Receiving)
- Ball Striking (Short & Long Distance)
- Passing (Short & Long Range)
- 1v1 Duel Ability

### 🧠 Mentality
- Emotion Control
- Self-Development Initiative
- Vocal Leadership
- Performance Consistency
- Focus & Concentration

### 🎯 Soccer Intelligence
- Game Anticipation & Reading
- Decision Making
- Position Versatility
- Space Usage & Creation

### 💪 Athleticism
- Agility
- Speed
- Stamina & Endurance

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Backend / Database** | [Supabase](https://supabase.com) (PostgreSQL + PostgREST) |
| **Authentication** | Supabase Auth (email/password for coaches) |
| **Hosting** | GitHub Pages with custom domain |

No build step required — the entire app runs directly in the browser.

---

## Pages

| File | Description |
|---|---|
| `index.html` | Landing page — overview of features and entry points |
| `player-access.html` | Player portal — enter a 5-character code to access your profile |
| `player-profile.html` | Player profile — view metrics, videos, goals, and badges |
| `admin-login.html` | Coach login via Supabase Auth |
| `admin-dashboard.html` | Coach dashboard — manage players, metrics, and videos |
| `rewards-leaderboard.html` | Team leaderboard with podium, rankings, and badge distribution |
| `request-admin.html` | Request access for new coaches |
| `reset-password.html` | Password reset flow |

---

## Getting Started

### For Coaches

1. Navigate to [trackeru.app/admin-login.html](https://trackeru.app/admin-login.html)
2. Log in with your coach credentials
3. Use the Admin Dashboard to add players, set metrics, assign videos, and track progress

### For Players & Parents

1. Navigate to [trackeru.app/player-access.html](https://trackeru.app/player-access.html)
2. Enter the 5-character code provided by your coach
3. View your development profile, training videos, and earned badges

---

## Local Development

Since this is a static site, no build process is needed:

```bash
# Clone the repository
git clone https://github.com/papisho/TrackerU.git
cd TrackerU

# Serve locally (any static file server works)
npx serve .
# or
python3 -m http.server 8080
```

Then open `http://localhost:8080` in your browser.

> **Note:** Full functionality (data persistence, authentication) requires a valid Supabase project. The app connects to a configured Supabase instance via `js/app.js`.

---

## Project Structure

```
TrackerU/
├── index.html                 # Landing page
├── player-access.html         # Player code entry
├── player-profile.html        # Player profile view
├── admin-login.html           # Coach authentication
├── admin-dashboard.html       # Coach management dashboard
├── rewards-leaderboard.html   # Team leaderboard
├── request-admin.html         # Admin access request
├── reset-password.html        # Password reset
├── css/
│   ├── styles.css             # Core design system & global styles
│   ├── analytics.css          # Analytics & chart styles
│   └── rewards.css            # Badges & leaderboard styles
└── js/
    ├── app.js                 # Core logic: Auth, DataManager, UI helpers
    ├── analytics.js           # Analytics & performance chart logic
    └── rewards.js             # Rewards, badges & points system
```

---

## License

© 2024 TrackerU — Soccer Player Development Platform. All rights reserved.

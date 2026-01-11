# Tournament Instance System Setup

The tournament payment system requires database tables to be created. 

## Required Tables

The system uses a tournament instance matchmaking approach where:
- Players are grouped into instances (game sessions) up to the max player count
- Each tier has a specific player limit (10 for Newbie, 7 for Rookie/Silver/Gold, etc.)
- Players can join multiple instances by paying multiple times
- Each instance tracks its players and starts when full

## Setup Instructions

**Run the SQL script to create the required tables:**

1. The SQL script is located at: `scripts/create-tournament-instances.sql`
2. You can run it directly from v0 or copy it to your Supabase SQL editor

The script creates:
- `tournament_instances` - Tracks each game session/lobby
- `tournament_instance_entries` - Tracks player entries in each instance
- Proper indexes and RLS policies

After running the script, the tournament payment flow will work correctly.

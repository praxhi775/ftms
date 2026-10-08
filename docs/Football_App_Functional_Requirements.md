# Football Team Management & Social Application

Purpose: Build an application where football groups can manage players, communicate through group and direct messaging, organize matches, and maintain player statistics. Automatic team generation will be added in a later phase.

1. Initial Scope  
    User registration and login.  
    Create a football group/team and join an existing group.  
    Assign roles such as Manager and Player.  
    Manager controls player's statistics, players cannot edit their own statistics.  
    Group chat for all members of a group.  
    Direct messaging between users.
    Create and manage football matches. 
    Basic user profile and group/member information.  
    Team generation/balancing will be implemented later.

2. Proposed Page Count  
    Recommended MVP: This keeps the first version manageable while covering all the requested functionality.

| \# | Page / Screen | Main Purpose | Key Features |
| ----- | ----- | ----- | ----- |
| 1 | Login | Authenticate existing users | Email/username \+ password, login, validation, forgot password, link to Sign Up |
| 2 | Sign Up | Create a user account | Name, username/email, password, basic profile information, account creation |
| 3 | Home / Dashboard | Entry point after login | My groups, recent messages, pending invitations |
| 4 | Group List / Create or Join Group | Manage group membership | Create group, join group using code/link, view groups, leave group |
| 5 | Group Details / Members | Manage and view a football group | Group info, member list, roles, manager controls, invite/join code, member profiles |
| 6 | Matches | Create and manage football matches. | Create match, date/time,location, participating players, availability |
| 7 | Player Statistics | View football performance data | Skill/stat categories, historical stats, manager-only edit/update, player read-only view |
| 8 | Group Chat | Communication within a group | Messages, timestamps, member names, send messages, basic message history |
| 9 | Direct Messages | Private user-to-user communication | Conversation list, search users, one-to-one chat, message history |
| 10 | Profile / Settings | Manage personal account | View/edit allowed profile data, password change, notification preferences, logout |

3. Page-by-Page Feature Details

Page 1 — Login  
 User enters credentials.  
 Validate credentials.  
 Successful login redirects to Dashboard.  
 Forgot-password flow can be included.  
 Unauthenticated users cannot access protected group/chat/stat pages.

Page 2 — Sign Up  
 Create account with basic information.  
 Validate unique email/username.  
 Password validation.  
 After registration, redirect to Login or automatically authenticate.

Page 3 — Home / Dashboard  
 Show groups the user belongs to.  
 Show unread group/direct messages.  
 Quick actions: Create Group, Join Group, Open Chat.  
 Show recent activity.

Page 4 — Group List / Create or Join Group  
 Create a new football group.  
 Generate a group code/link for joining.  
 Join a group using code/link.  
 Display all groups the current user belongs to.  
 Leave a group, subject to manager/business rules.

Page 5 — Group Details / Members  
 Display group name and information.  
 List all members.  
 Show each member's role.  
 Manager can manage members and roles.  
 Invite users / share join code.  
 Open a member's profile/statistics.  
 This page is the main navigation point for group-specific features.

Page 6 — Matches
This page handles the actual football games organized by the group.
Create Match
Manager can create a match with:
Match date.
Start time.
Location/venue.
Optional description.
Number of expected players.
Player Availability
Group members can:
Mark themselves as Available.
Mark themselves as Unavailable.
Optionally mark themselves as Maybe.
Match Details
Display:
Match information.
List of participating players.
Available/unavailable players.
Match status.
Number of confirmed players.
Future Integration
When automatic team generation is implemented, this page can provide:
Match → Participating Players → Generate Balanced Teams
The team-generation algorithm will use the manager-controlled player statistics.

Page 7 — Player Statistics  
 Display football skills/statistics for each player.  
 Example skills: passing, shooting, dribbling, defending, stamina, etc.  
 Manager is allowed to create/update player stats.  
 Players can view their own stats and other permitted stats but cannot modify them.  
 Maintain updated values and optionally a history of previous ratings.  
 Future team-generation logic will use these stats.

Page 8 — Group Chat  
 One shared conversation for the group.  
 Send and receive messages.  
 Show sender, timestamp, and message.  
 Load previous messages.  
 Restrict access to current group members.

Page 9 — Direct Messages  
 Search/select another user.  
 Create or open a one-to-one conversation.  
 Send and receive private messages.  
 Conversation history.  
 Show unread message count.

Page 10 — Profile / Settings  
 View profile.  
 Edit basic user information.  
 Change password.  
 Notification preferences if required.  
 Logout.  
 Do not expose controls that allow a player to edit manager-controlled football statistics.

4. Roles & Permissions

| Feature | Manager | Player |
| ----- | ----- | ----- |
| View group | Yes | Yes |
| Join/create group | Yes | Yes, subject to group rules |
| Manage members | Yes | No |
| Manage roles | Yes | No |
| View player stats | Yes | Yes |
| Create/update player stats | Yes | No |
| Group chat | Yes | Yes |
| Direct messages | Yes | Yes |

5.   
   Important Business Rules  
    A user must be authenticated before accessing groups, chats, or statistics.  
    A user can belong to one or more football groups.  
    Each group must have at least one Manager.  
    Player statistics are controlled by the Manager; players cannot directly update their own ratings.  
    Only group members can access that group's group chat data.  
    Direct messages are private to the participants.  
    Team generation should read the manager-controlled player statistics when that feature is introduced.  
    Authorization must be enforced on the backend, not only by hiding buttons in the frontend.

6. Future Phase — Automatic Team Generation  
    This feature should be added after the group, player statistics, and role/permission systems are stable. The future algorithm can use manager controlled skill ratings to divide players into balanced teams.  
    Choose number of teams / players per team.  
    Use player skill ratings as input.  
    Optionally consider player positions.  
    Calculate a team-balance score.  
    Generate teams with minimum skill imbalance.  
    Allow regeneration when multiple equally good combinations exist.

7. Recommended Navigation Flow  
    Login / Sign Up → Dashboard → Group List → Group Details → Chat / Members / Player Stats  
    From Dashboard or user search → Direct Messages.

8. MVP Summary  
    The first version should concentrate on three core areas: (1) group management, (2) communication, and (3) manager-controlled player statistics. Automatic team generation should remain a separate phase so that the core data and permission model are correct before the balancing algorithm is added.


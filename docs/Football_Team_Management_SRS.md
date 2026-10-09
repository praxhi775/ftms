**SOFTWARE REQUIREMENTS**  
**SPECIFICATION**

**Football Team Management Application**

**Version 1.1**  
Date: 9 October 2026  
Status: Revised baseline (client-side React web app, no backend)

*A manager-operated application for player records, configurable performance statistics, random team generation, match results, historical records, and analytics.*

**Revision notes (v1.1):** The Flutter/Android + Spring Boot/PostgreSQL architecture is replaced by a backend-less, web-only, responsive React app. Data is stored in the browser (IndexedDB / localStorage) with export/import of the player pool and history, and the app is hosted on GitHub Pages. Team generation now supports N teams of T players, with extra players placed by the manager. A FIFA-style player card (overall rating, radar chart, colour-coded badges, foot and star ratings) is the standard way to present player stats. Figma / Stitch prototyping is the first delivery step.

# 

# **Contents**

* 1\. Introduction  
* 2\. Overall Description  
* 3\. Functional Requirements  
* 4\. Data Requirements and Proposed Data Model  
* 5\. External Interface Requirements  
* 6\. Non-Functional Requirements  
* 7\. Business Rules and Validation  
* 8\. Use Cases  
* 9\. Acceptance Criteria  
* 10\. Future Enhancements  
* 11\. Assumptions and Open Decisions  
* 12\. Delivery Plan

# **1\. Introduction**

## **1.1 Purpose**

This SRS defines the functional and non-functional requirements for a Football Team Management Application. It is intended to guide implementation, testing, and future enhancement.

## **1.2 Product Scope**

The application enables one manager to maintain a database of football players, create and manage custom player-stat categories and fields, assign player ratings, select the players available for a match, randomly divide the selected players into N teams of T players each, record match outcomes, and view statistics and historical performance.

The application is a client-side, responsive web application with no backend. All data is stored in the manager's browser and can be exported and imported as a backup.

The first release uses random team generation. AI-driven or optimization-based balanced team creation is a future enhancement and is not required for the initial release.

## **1.3 Definitions**

| Term | Definition |
| :---- | :---- |
| Manager | The sole intended application user; can manage players, ratings, teams, and matches. |
| Player | A football participant stored in the database; players do not have application accounts. |
| Stat category | A grouping of related performance attributes, such as Technical, Tactical, or Physical. |
| Stat field | A configurable attribute within a category, such as Passing or Stamina. |
| Player stat | A player's rating for a particular stat field. |
| Match | A recorded football game with participating players, teams, score, and result. |
| Available player | A player selected by the manager as participating in a particular match. |
| Number of teams (N) | The number of teams the manager chooses to create for a match. |
| Team size (T) | The number of players in each team. |
| Extra player | A selected player beyond the N × T needed to fill all teams; the manager decides where to place them. |
| Data file | A JSON file containing the exported player pool, statistics configuration, and match history, used for backup, restore, and transfer. |
| Player card | The visual presentation of a player's ratings: overall rating, radar chart of headline attributes, and an attributes panel (preferred foot and star ratings). |
| Headline attribute | A stat category plotted as one axis of the radar chart (by default Pace, Shooting, Passing, Dribbling, Defending, Physical). |
| Overall rating | A single 0–100 value derived from a player's headline attributes. |

# **2\. Overall Description**

## **2.1 Product Perspective**

The application is a manager-operated, client-side web application. There is no backend server or API: all business logic runs in the browser, and data is persisted locally using IndexedDB (primary store for the player pool, statistics configuration, and match history), with localStorage for small settings where needed. The manager can export the full dataset (player pool and history) to a file and import it again; this is the mechanism for backup, restore, and moving data between browsers or devices. The user interface is built with React, is web-only and responsive, and is hosted as a static site on GitHub Pages.

## **2.2 User Class**

| User | Responsibilities | Access |
| :---- | :---- | :---- |
| Manager | Manage all player, statistic, team-generation, match, and analytics features. | Full application access; no login in this release. |

## **2.3 Operating Environment**

* Modern desktop and mobile web browsers with IndexedDB support (current versions of Chrome, Edge, Firefox, and Safari).  
* Responsive layout: usable on phones (portrait is the primary phone layout; landscape must not break the UI), tablets, and desktops.  
* The app is served as static files over HTTPS from GitHub Pages. Network access is needed only to load the app; no backend or database server is required.  
* Data is stored per browser profile on the device being used.

## **2.4 Constraints**

* Only players explicitly selected by the manager may be included in a generated match.  
* A player must not appear on more than one team in the same match.  
* Match records must retain the teams and player assignments that existed for that match, even if player profiles are later edited.  
* The initial team-generation algorithm must be random, not AI-based.
* There is no backend: all data lives in the manager's browser, so durability depends on browser storage plus the manager's exported backups.  
* The UI must be React-based, web-only, and responsive; native mobile apps are out of scope.  
* Hosting is limited to static files on GitHub Pages.

# **3\. Functional Requirements**

## **3.1 Dashboard**

**FR-001:** The system shall provide a manager dashboard as the main entry point.

**FR-002:** The dashboard shall show useful summaries, including total players, recent matches, and win/loss/draw totals where data is available.

**FR-003:** The system shall provide navigation to player management, statistics configuration, team generation, match history, and analytics.

## **3.2 Player Management**

**FR-004:** The manager shall be able to create a player record, including name, position, and preferred foot (Left, Right, or Both).

**FR-005:** The manager shall be able to view a list of all players and open an individual player profile.

**FR-006:** The manager shall be able to update a player's details.

**FR-007:** The manager shall be able to delete or archive a player, subject to historical-match data integrity rules.

**FR-008:** The player list shall support searching by player name.

## **3.3 Configurable Statistics**

**FR-010:** The manager shall be able to create, view, rename, and delete stat categories.

**FR-011:** The manager shall be able to create custom stat fields inside a category.

**FR-012:** Each stat field shall have a name and a rating type: numeric (0–100), qualitative (Low, Medium, High), or star rating (whole stars, 1–5).

**FR-013:** The manager shall be able to edit a field's name and configuration, subject to preserving or safely migrating existing ratings.

**FR-014:** The manager shall be able to assign or update a player's rating for each configured field.

**FR-015:** The system shall validate ratings according to the field's configured type.

**FR-016:** The player profile shall display ratings grouped by their categories.

## **3.4 Player Selection and Random Team Generation**

**FR-018:** The manager shall be able to view players stored in the database before creating a match.

**FR-019:** The manager shall be able to select only the players available for the particular match; the system shall not automatically include every database player.

**FR-020:** The manager shall be able to choose the number of teams (N) and the number of players per team (T).

**FR-021:** The system shall validate that the number of selected unique players is at least N × T (minimum player count ≥ N × T). A selection smaller than N × T shall be rejected with a message stating the required minimum. For example, 2 teams of 7 require at least 14 players.

**FR-022:** The system shall randomly shuffle the selected players and divide them into N teams of exactly T players each. If more than N × T players were selected, the surplus (extra) players shall be left unassigned for the manager to place.

**FR-023:** The system shall use only the selected player IDs when generating teams.

**FR-024:** The system shall list any extra players separately after generation. The manager shall decide where to put them: add each extra player to a team of the manager's choice, or keep them as substitutes (bench) who are recorded with the match but belong to no team.

**FR-025:** The manager shall be able to review the generated teams before confirming the match.

**FR-026:** The manager should be able to regenerate the random allocation (including which players are extras) before the match is confirmed.

**FR-027:** Once confirmed, the system shall persist the match and its team/player assignments.

**FR-028:** The team-generation design shall allow the random algorithm to be replaced or extended with a future balancing algorithm without changing the player-selection workflow.

## **3.5 Match Management and History**

**FR-029:** The manager shall be able to create a match record with a date/time and participating teams.

**FR-030:** The manager shall be able to record or update the score for each team.

**FR-031:** The system shall determine the match outcome from the recorded scores: win, loss, or draw. For matches with more than two teams, the highest-scoring team wins; if two or more teams tie for the highest score they draw, and the remaining teams lose.

**FR-032:** The system shall save the match status, score, participants, team assignments, and final result.

**FR-033:** The manager shall be able to view match history and open an individual match.

**FR-034:** The manager shall be able to correct a result, with the stored result and derived statistics recalculated consistently.

**FR-035:** The system shall calculate player-level matches played, wins, losses, draws, and win percentage from completed match records.

**FR-036:** The system shall calculate group/team-level match summaries from completed match records.

**FR-037:** The system shall distinguish planned, in-progress, completed, and cancelled matches if those statuses are supported by the UI.

**FR-038:** The system shall preserve historical participant assignments even if a player's current profile or status changes.

## **3.6 Charts and Analytics**

**FR-039:** The system shall display a player's ratings as a player card (FR-049 to FR-059), whose radar chart is the primary chart. Additional charts, such as bar charts, may be offered.

**FR-040:** The system shall display match history and player/team win-loss-draw summaries.

**FR-041:** The system shall show a win percentage only when the denominator is greater than zero; otherwise it shall show an appropriate empty state.

**FR-042:** Qualitative ratings may be displayed as labels or mapped to a documented ordinal scale for visualization; the original rating must remain unchanged in storage.

**FR-043:** If historical stat snapshots are implemented, the system may show rating trends over time. This is optional for the initial release.

### **3.6.1 Player Card**

**FR-049:** The system shall present each player's ratings as a player card at the top of the player profile, and the manager shall be able to open it from the player list.

**FR-050:** The card header shall show the player's name and the Overall Rating as a prominent number with a colour-coded badge.

**FR-051:** The card shall include a radar chart (a filled polygon on a hexagonal grid for six axes) whose axes are the headline attributes. By default the six headline attributes are Pace (PAC), Shooting (SHO), Passing (PAS), Dribbling (DRI), Defending (DEF), and Physical (PHY). Each axis shall show its short label and the numeric value in a colour-coded badge beside it, and the polygon shall be filled with a translucent colour.

**FR-052:** Each headline attribute is a stat category. Its value shall be the average of the player's numeric (0–100) fields in that category, rounded to the nearest whole number. Qualitative and star-rated fields are not included in the radar value.

**FR-053:** The manager shall be able to choose which stat categories appear on the radar (at least 3, at most 8, default 6) and give each a short label.

**FR-054:** The Overall Rating shall be the average of the player's headline attribute values, rounded to the nearest whole number. Headline attributes with no rating are excluded from the average.

**FR-055:** Rating badges shall be colour-coded by value band. By default: green for 80 and above, yellow for 60 to 79, and gray for below 60. The thresholds shall be defined in one place so they can be changed.

**FR-056:** Below the chart, the card shall show an attributes panel in a two-column grid. It shall include Preferred Foot (left and right foot icons, with the player's foot highlighted, or both) and star-rated fields shown as filled and empty stars out of five.

**FR-057:** The default star-rated fields shall be Weak Foot, Skill Moves, and International Reputation. They are ordinary stat fields of type star rating, so the manager can rename, add, or remove them (FR-011, FR-013).

**FR-058:** If a headline attribute has no rating, its axis shall show "–" with no colour and be plotted at the centre. If the player has no ratings at all, the card shall show an empty state such as "No ratings yet" instead of an Overall Rating.

**FR-059:** The card shall be responsive: stacked and full width on phones, with the chart and attributes panel allowed side by side on larger screens. The chart shall resize with the viewport, be drawn as SVG or canvas, and have a text alternative listing every value. The card shall update immediately after ratings change.

## **3.7 Data Storage, Export and Import**

**FR-044:** The system shall persist all player, statistic-configuration, and match data in the browser using IndexedDB (localStorage may be used for small preferences), without any backend service.

**FR-045:** The manager shall be able to export all data, including the player pool, stat categories, fields, ratings, and match history, to a downloadable JSON file.

**FR-046:** The manager shall be able to import a previously exported file to restore or transfer data. The system shall validate the file's format and version before importing and shall leave existing data unchanged if validation fails.

**FR-047:** The system shall ask the manager to confirm before an import overwrites existing data.

**FR-048:** The system shall tell the manager that data is stored only in this browser and can be lost if site data is cleared unless it has been exported. The dashboard may show the date of the last export.

# **4\. Data Requirements and Proposed Data Model**

The following entities are a proposed logical model. In the application they are stored as IndexedDB object stores in the browser, with IDs generated client-side (for example, UUIDs).

| Entity | Key fields (illustrative) | Purpose / relationships |
| :---- | :---- | :---- |
| Player | id, name, position, preferredFoot, active, createdAt, updatedAt | Stores each player profile. |
| StatCategory | id, name, shortLabel, description, active, showOnRadar, sortOrder | Groups stat fields, e.g. Pace, Shooting, Passing; categories with showOnRadar are the headline attributes. |
| StatField | id, categoryId, name, ratingType (NUMERIC, QUALITATIVE, STARS), active | Defines a configurable attribute and its allowed rating type. |
| PlayerStat | id, playerId, statFieldId, numericValue, qualitativeValue, starValue, updatedAt | Stores a player's value for a field; exactly one value format should be populated. |
| Match | id, scheduledAt, numTeams, teamSize, status, createdAt, completedAt | Stores match metadata and lifecycle. |
| MatchTeam | id, matchId, name/label, score, result | Represents each side in a match. |
| MatchPlayer | id, matchTeamId (null for bench), playerId, playerNameSnapshot | Associates a player with a side, or with the bench if the manager did not place an extra player on a team; preserves historical identity where needed. |

## **4.1 Relationships**

* One StatCategory can contain many StatFields.  
* One Player can have many PlayerStat records; each PlayerStat references one StatField.  
* One Match contains N MatchTeam records (N ≥ 2), each normally with T players, plus any manager-placed extra players.  
* One MatchTeam contains multiple MatchPlayer records.  
* A player must appear at most once in a single match across all teams and the bench.

## **4.2 Data Integrity**

* Use stable IDs for players, categories, fields, matches, and assignments.  
* Validate numeric ratings from 0 through 100 inclusive.  
* Store qualitative ratings using a controlled set of values: LOW, MEDIUM, HIGH.  
* Store star ratings as whole numbers from 1 through 5.  
* Headline attribute values and the Overall Rating are derived when displayed and are not stored.
* A field's rating type must be consistent with the value stored for each player.  
* The match result should be derived from scores or kept synchronized whenever scores are corrected.
* Store a schema version in the browser database and in every export file so later changes can be migrated.  
* Writes that span several records (for example, confirming a match and its assignments) shall run in a single IndexedDB transaction.  
* An export file must contain everything needed to rebuild the player pool and history exactly, including IDs and name snapshots.

# **5\. External Interface Requirements**

## **5.1 User Interface**

* Provide a player list with search and selection controls.  
* Provide forms for player creation and editing with clear validation messages.  
* Provide category and field management screens.  
* Provide a player-stat editor that renders the correct input based on the field's rating type.  
* Provide a player card (overall rating, radar chart with colour-coded value badges, preferred foot, and star ratings) on the player profile.  
* Provide a match setup screen where the manager selects available players and chooses team size.  
* Show generated teams for review before confirmation.  
* Provide match-result entry and match-history views.  
* Provide charts and readable empty states when no data exists.
* Provide data export and import controls with confirmation and clear success/error messages.  
* Provide a responsive layout that works at phone, tablet, and desktop widths.

## **5.2 Client-Side Service Layer (No Backend)**

There is no backend or REST API. The React UI shall access data only through local service modules that wrap IndexedDB, so storage could later be swapped for a remote API without changing the UI.

| Area | Example service operations |
| :---- | :---- |
| Players | listPlayers, createPlayer, getPlayer, updatePlayer, deletePlayer / archivePlayer |
| Stat categories | listCategories, createCategory, updateCategory, deleteCategory |
| Stat fields | createField, updateField, deleteField |
| Player ratings | getPlayerStats, savePlayerStats |
| Player card | getPlayerCard(playerId) returns headline attribute values, Overall Rating, preferred foot, and star ratings |
| Team generation | generateTeams(selectedPlayerIds, numTeams, teamSize) |
| Matches | createMatch, listMatches, getMatch, saveResult |
| Analytics | getPlayerAnalytics, getMatchAnalytics |
| Data export / import | exportData, importData |

The team-generation operation takes the selected player IDs, N, and T. It must validate the request (unique IDs, count ≥ N × T) and must not load all players and silently include them.

## **5.3 Export/Import File**

Exported data shall be a single JSON file containing a format version, an export timestamp, the player pool, stat categories, fields and ratings, and the match history (teams, scores, players, and name snapshots).

## **5.4 Hosting and Deployment**

The app shall be built as a static bundle and deployed to GitHub Pages over HTTPS. Routing must work on a static host (for example, hash-based routing or a 404 fallback), and asset paths must respect the repository's base path.

# **6\. Non-Functional Requirements**

**NFR-001 — Usability:** The manager should be able to complete common operations with clear labels, predictable navigation, and actionable validation messages.

**NFR-002 — Performance:** For a typical small-to-medium player database, common list and detail operations should normally complete within 2 seconds on a typical phone or laptop browser, since all data is local.

**NFR-003 — Data persistence:** Confirmed player, statistic, and match changes shall persist across page reloads and browser restarts, unless the user or browser clears site data.

**NFR-004 — Reliability:** A failed team-generation or match-save operation shall not leave a partially saved match; multi-record writes use a single IndexedDB transaction.

**NFR-005 — Integrity:** The system shall prevent duplicate player assignment to teams in the same match and validate all data in the service layer before it is stored.

**NFR-006 — Maintainability:** Keep player management, statistics, team generation, match management, and analytics in separate service/module responsibilities.

**NFR-007 — Extensibility:** The team-generation algorithm shall be replaceable without redesigning match and player-selection APIs.

**NFR-008 — Compatibility:** The interface shall be responsive and work at phone, tablet, and desktop viewport sizes in current versions of major browsers.

**NFR-009 — Security limitation:** Authentication is intentionally excluded. Data stays in the manager's browser and is not sent to any server, but anyone with access to the device and browser profile can view it, and exported files are unencrypted. The app is publicly reachable on GitHub Pages, so it must not contain secrets or sensitive personal data.

**NFR-010 — Backup:** Because data lives only in the browser, the manager shall be able to back up and restore it using export/import, and the app shall make this easy to find.

**NFR-011 — Hosting:** The application shall be deployable as static files on GitHub Pages with no server-side component.

# **7\. Business Rules and Validation**

| ID | Rule |
| :---- | :---- |
| BR-001 | The manager is the only intended user of the application. |
| BR-002 | Players are records, not user accounts. |
| BR-003 | A team-generation operation uses only the player IDs selected by the manager. |
| BR-004 | To create N teams of T players, the selection must contain at least N × T unique eligible players. |
| BR-005 | No player can be assigned to more than one team in the same match. |
| BR-006 | The manager can regenerate teams before confirming the match. |
| BR-007 | Once a match is confirmed, its team membership must be persisted for history. |
| BR-008 | For two teams, equal scores are a draw and the higher score wins. With more than two teams, the highest score wins, teams tied for the highest score draw, and the rest lose. |
| BR-009 | Win percentage \= wins / matches played × 100\. A zero-match player has no defined percentage. |
| BR-010 | Numeric stat ratings must be between 0 and 100 inclusive; qualitative ratings must be Low, Medium, or High; star ratings must be whole numbers from 1 to 5. |
| BR-011 | Extra players beyond N × T are not auto-assigned; the manager decides where to place them (a team or the bench). |
| BR-012 | Data is stored locally in the browser; export/import is the only backup and transfer mechanism. |
| BR-013 | A headline attribute value is the rounded average of the numeric fields in its category; the Overall Rating is the rounded average of the headline attribute values. |
| BR-014 | Badge colours follow the value bands in FR-055 (default: green 80+, yellow 60–79, gray below 60). |

# **8\. Use Cases**

## **UC-01: Manage a Player**

Primary actor: Manager

Precondition: The application is open in the browser.

Main flow:

1. The manager opens Player Management.  
2. The manager creates, views, updates, or deletes/archives a player.  
3. The system validates the submitted data.  
4. The system saves the changes and displays the updated player list or profile.

Alternative flow: If validation fails, the system displays the issue and does not save invalid data.

## **UC-02: Configure and Assign Player Statistics**

Primary actor: Manager

Main flow:

1. The manager creates or selects a stat category.  
2. The manager adds a field and chooses Numeric (0–100) or Low/Medium/High.  
3. The manager opens a player profile and enters a rating for the field.  
4. The system validates the value and saves it.  
5. The player profile and analytics display the saved rating.

## **UC-03: Generate Teams for a Match**

Primary actor: Manager

Precondition: Enough eligible player records exist (at least N × T).

Main flow:

1. The manager opens the team-generation screen.  
2. The system displays players from the player pool.  
3. The manager selects the players available for this match.  
4. The manager chooses the number of teams (N) and the team size (T).  
5. The system validates that the selection is unique and contains at least N × T players.  
6. The system randomly shuffles only the selected players and fills N teams of T players each.  
7. If extra players remain, the system lists them and the manager decides where to put them (a team, or the bench).  
8. The manager reviews or regenerates the allocation.  
9. The manager confirms the match, and the system persists the match and assignments in the browser.

Alternative flow: If the selection is invalid, the system explains the required minimum or the invalid player IDs and does not save the match.

## **UC-04: Record a Match Result**

Primary actor: Manager

1. The manager opens a scheduled or in-progress match.  
2. The manager enters each team's score.  
3. The system validates scores and determines win, loss, or draw.  
4. The manager saves the result.  
5. The system updates match history and derived player/team statistics.

## **UC-05: Export and Import Data**

Primary actor: Manager

Main flow:

1. The manager opens the data export/import screen.  
2. To back up, the manager chooses Export and the system downloads a JSON file containing the player pool and history.  
3. To restore, the manager chooses Import and selects a previously exported file.  
4. The system validates the file's format and version.  
5. The system asks the manager to confirm before overwriting existing data, then imports the data.

Alternative flow: If the file is invalid or from an unsupported version, the system shows an error and leaves existing data unchanged.

## **UC-06: View a Player Card**

Primary actor: Manager

Precondition: The player has at least one rating.

Main flow:

1. The manager opens a player from the player list.  
2. The system calculates the headline attribute values and the Overall Rating from the saved ratings.  
3. The system shows the player card: Overall Rating, radar chart with colour-coded value badges, preferred foot, and star ratings.  
4. The manager edits a rating, and the card updates immediately.

Alternative flow: If the player has no ratings, the system shows the "No ratings yet" empty state.

# **9\. Acceptance Criteria**

| ID | Acceptance criterion |
| :---- | :---- |
| AC-01 | The manager can add a player and see the saved player in the list, including after reloading the page. |
| AC-02 | The manager can update and remove/archive a player without unintentionally deleting historical match records. |
| AC-03 | The manager can create categories such as Pace, Shooting, Passing, Dribbling, Defending, and Physical, and add custom fields under them. |
| AC-04 | A numeric field accepts 0 and 100, but rejects values below 0 or above 100\. |
| AC-05 | A qualitative field accepts only Low, Medium, or High. |
| AC-06 | If 14 unique eligible players are selected for 2 teams of 7, the system creates two teams of 7 using only those 14 players and no extra players. |
| AC-07 | If fewer than N × T players are selected, the system prevents team generation and confirmation and explains the minimum required. |
| AC-08 | No selected player appears on more than one team in one match. |
| AC-09 | Regenerating teams changes the allocation but does not add unselected players. |
| AC-10 | After confirmation, refreshing the page or restarting the browser does not remove the saved match assignments. |
| AC-11 | Entering scores of 3–1 marks the first team as winner; equal scores mark the match as a draw. |
| AC-12 | Correcting a saved score updates the displayed result and calculated win/loss/draw summaries. |
| AC-13 | Player profile charts display the player's configured ratings, and match analytics reflect completed match records. |
| AC-14 | The application has no login screen or player account workflow in the initial release. |
| AC-15 | If 17 players are selected for 3 teams of 5, the system fills the teams with 15 randomly chosen players and shows the 2 extra players for the manager to place on a team or the bench. |
| AC-16 | The manager can export the player pool and history to a file and import it into a fresh browser to restore the same data. |
| AC-17 | Importing an invalid or unsupported file shows an error and leaves existing data unchanged. |
| AC-18 | The app runs as a static site on GitHub Pages with no backend service. |
| AC-19 | The UI is usable at phone and desktop widths without horizontal scrolling for core screens. |
| AC-20 | The player card shows the Overall Rating and a radar chart with six labelled axes, each with its value in a coloured badge. |
| AC-21 | A headline attribute equals the rounded average of the numeric fields in its category, and the Overall Rating equals the rounded average of the headline attributes. |
| AC-22 | Values of 86, 76, and 43 show green, yellow, and gray badges respectively (default bands). |
| AC-23 | The card shows preferred foot and star ratings (for example Weak Foot 4 of 5), and a star field rejects values outside 1 to 5. |
| AC-24 | A player with no ratings shows an empty state, and a missing headline attribute shows "–" and is left out of the Overall Rating. |
| AC-25 | The player card is readable on phone and desktop widths without horizontal scrolling. |

# **10\. Future Enhancements**

* Smart team generation that balances team ratings, positions, and player roles.  
* Optimization-based balancing before or alongside AI-based recommendations.  
* Position-specific constraints and minimum goalkeeper requirements.  
* Historical rating snapshots and player improvement trends.  
* Exporting match results and player statistics to CSV or PDF (in addition to the JSON data backup).  
* Multiple groups or leagues, if required by future usage.  
* Optional backend or cloud sync for multi-device or multi-manager use.  
* Authentication and access controls if a backend or shared data is added later.

# **11\. Assumptions and Open Decisions**

* The manager is the only person using the application, and no login is required for the initial version.  
* The first release generates N teams of equal size T. Teams become uneven only if the manager places extra players on specific teams.  
* The manager chooses the available players separately for every match; player availability is not assumed to be permanent.  
* Player position is a useful profile field, but position-based balancing is not part of random generation.  
* Decided: React web-only responsive UI, no backend, browser storage (IndexedDB / localStorage) with export/import of the player pool and history, and hosting on GitHub Pages.  
* The project owner should decide whether deletion means permanent deletion or archiving. Archiving is recommended for players with match history.  
* The project owner should decide whether ratings need a dated history or only the latest rating for the first release.  
* Because authentication is out of scope and the app is publicly hosted, player data should be limited to non-sensitive information such as name, position, and ratings.  
* Browser storage can be cleared by the user or the browser, so regular exports are the recommended safeguard.  
* The project owner should decide whether import replaces existing data or can also merge with it; replace-with-confirmation is assumed for the first release.  
* The project owner should confirm that extra players not placed on a team are kept as bench players recorded with the match.  
* The project owner should confirm the outcome rules for matches with more than two teams (FR-031).
* The project owner should confirm the default colour bands (green 80+, yellow 60–79, gray below 60) and whether the Overall Rating should use equal or weighted headline attributes (equal is assumed).  
* The project owner should confirm whether the card should keep the "International Reputation" field, which is a game concept, or replace it with a field that suits the group.



# **12\. Delivery Plan**

1. **Step 1 — Prototyping:** Design the UI in Figma or Stitch before implementation, covering the dashboard, player list, player card (overall rating, radar chart, badges, star ratings), stat configuration, match setup and team generation, match history, analytics, and data export/import.  
2. Further implementation phases will be planned after the prototype is reviewed.
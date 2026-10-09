**SOFTWARE REQUIREMENTS**  
**SPECIFICATION**

**Football Team Management Application**

**Version 1.0**  
Date: 9 October 2026  
Status: Initial requirements baseline

*A manager-operated application for player records, configurable performance statistics, random team generation, match results, historical records, and analytics.*

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

# **1\. Introduction**

## **1.1 Purpose**

This SRS defines the functional and non-functional requirements for a Football Team Management Application. It is intended to guide implementation, testing, and future enhancement.

## **1.2 Product Scope**

The application enables one manager to maintain a database of football players, create and manage custom player-stat categories and fields, assign player ratings, select the players available for a match, randomly divide the selected players into teams, record match outcomes, and view statistics and historical performance.

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

# **2\. Overall Description**

## **2.1 Product Perspective**

The application is a manager-operated system backed by a persistent database. The user interface will communicate with a backend API, which validates requests and stores player, statistic, and match data. A relational database such as PostgreSQL is a suitable option. Spring Boot is a proposed backend technology; the frontend technology is Flutter.

## **2.2 User Class**

| User | Responsibilities | Access |
| :---- | :---- | :---- |
| Manager | Manage all player, statistic, team-generation, match, and analytics features. | Full application access; no login in this release. |

## **2.3 Operating Environment**

* Android phones.  
* Portrait orientation is the primary supported layout, landscape should not break the UI.  
* A running application backend and db reachable from the device over https.

* Network connectivity between the backend and mobile app.

## **2.4 Constraints**

* Only players explicitly selected by the manager may be included in a generated match.  
* A player must not appear on both teams in the same match.  
* Match records must retain the teams and player assignments that existed for that match, even if player profiles are later edited.  
* The initial team-generation algorithm must be random, not AI-based.

# **3\. Functional Requirements**

## **3.1 Dashboard**

**FR-001:** The system shall provide a manager dashboard as the main entry point.

**FR-002:** The dashboard shall show useful summaries, including total players, recent matches, and win/loss/draw totals where data is available.

**FR-003:** The system shall provide navigation to player management, statistics configuration, team generation, match history, and analytics.

## **3.2 Player Management**

**FR-004:** The manager shall be able to create a player record.

**FR-005:** The manager shall be able to view a list of all players and open an individual player profile.

**FR-006:** The manager shall be able to update a player's details.

**FR-007:** The manager shall be able to delete or archive a player, subject to historical-match data integrity rules.

**FR-008:** The player list shall support searching by player name.

## **3.3 Configurable Statistics**

**FR-010:** The manager shall be able to create, view, rename, and delete stat categories.

**FR-011:** The manager shall be able to create custom stat fields inside a category.

**FR-012:** Each stat field shall have a name and a rating type: numeric (0–100) or qualitative (Low, Medium, High).

**FR-013:** The manager shall be able to edit a field's name and configuration, subject to preserving or safely migrating existing ratings.

**FR-014:** The manager shall be able to assign or update a player's rating for each configured field.

**FR-015:** The system shall validate ratings according to the field's configured type.

**FR-016:** The player profile shall display ratings grouped by their categories.

## **3.4 Player Selection and Random Team Generation**

**FR-018:** The manager shall be able to view players stored in the database before creating a match.

**FR-019:** The manager shall be able to select only the players available for the particular match; the system shall not automatically include every database player.

**FR-020:** The manager shall be able to choose the number of players per team or an equivalent team-size configuration.

**FR-021:** The system shall validate that the selected player count matches the configured team sizes. For two equal teams of N players, exactly 2N unique players are required.

**FR-022:** The system shall randomly shuffle the selected players and divide them into the requested teams.

**FR-023:** The system shall use only the selected player IDs when generating teams.

**FR-025:** The manager shall be able to review the generated teams before confirming the match.

**FR-026:** The manager should be able to regenerate the random allocation before the match is confirmed.

**FR-027:** Once confirmed, the system shall persist the match and its team/player assignments.

**FR-028:** The team-generation design shall allow the random algorithm to be replaced or extended with a future balancing algorithm without changing the player-selection workflow.

## **3.5 Match Management and History**

**FR-029:** The manager shall be able to create a match record with a date/time and participating teams.

**FR-030:** The manager shall be able to record or update the score for each team.

**FR-031:** The system shall determine the match outcome from the recorded scores: win, loss, or draw.

**FR-032:** The system shall save the match status, score, participants, team assignments, and final result.

**FR-033:** The manager shall be able to view match history and open an individual match.

**FR-034:** The manager shall be able to correct a result, with the stored result and derived statistics recalculated consistently.

**FR-035:** The system shall calculate player-level matches played, wins, losses, draws, and win percentage from completed match records.

**FR-036:** The system shall calculate group/team-level match summaries from completed match records.

**FR-037:** The system shall distinguish planned, in-progress, completed, and cancelled matches if those statuses are supported by the UI.

**FR-038:** The system shall preserve historical participant assignments even if a player's current profile or status changes.

## **3.6 Charts and Analytics**

**FR-039:** The system shall display a player's numeric ratings in suitable charts, such as bar or radar charts.

**FR-040:** The system shall display match history and player/team win-loss-draw summaries.

**FR-041:** The system shall show a win percentage only when the denominator is greater than zero; otherwise it shall show an appropriate empty state.

**FR-042:** Qualitative ratings may be displayed as labels or mapped to a documented ordinal scale for visualization; the original rating must remain unchanged in storage.

**FR-043:** If historical stat snapshots are implemented, the system may show rating trends over time. This is optional for the initial release.

# **4\. Data Requirements and Proposed Data Model**

The following entities are a proposed logical model. 

| Entity | Key fields (illustrative) | Purpose / relationships |
| :---- | :---- | :---- |
| Player | id, name, position, active, createdAt, updatedAt | Stores each player profile. |
| StatCategory | id, name, description, active | Groups stat fields, e.g. Technical, Tactical, Physical. |
| StatField | id, categoryId, name, ratingType, active | Defines a configurable attribute and its allowed rating type. |
| PlayerStat | id, playerId, statFieldId, numericValue, qualitativeValue, updatedAt | Stores a player's value for a field; exactly one value format should be populated. |
| Match | id, scheduledAt, status, createdAt, completedAt | Stores match metadata and lifecycle. |
| MatchTeam | id, matchId, name/label, score, result | Represents each side in a match. |
| MatchPlayer | id, matchTeamId, playerId, playerNameSnapshot | Associates a player with a side and preserves historical identity where needed. |

## **4.1 Relationships**

* One StatCategory can contain many StatFields.  
* One Player can have many PlayerStat records; each PlayerStat references one StatField.  
* One Match contains two or more MatchTeam records; the first release may limit a match to exactly two teams.  
* One MatchTeam contains multiple MatchPlayer records.  
* A player must appear at most once in a single match across all teams.

## **4.2 Data Integrity**

* Use stable IDs for players, categories, fields, matches, and assignments.  
* Validate numeric ratings from 0 through 100 inclusive.  
* Store qualitative ratings using a controlled set of values: LOW, MEDIUM, HIGH.  
* A field's rating type must be consistent with the value stored for each player.  
* The match result should be derived from scores or kept synchronized whenever scores are corrected.

# **5\. External Interface Requirements**

## **5.1 User Interface**

* Provide a player list with search and selection controls.  
* Provide forms for player creation and editing with clear validation messages.  
* Provide category and field management screens.  
* Provide a player-stat editor that renders the correct input based on the field's rating type.  
* Provide a match setup screen where the manager selects available players and chooses team size.  
* Show generated teams for review before confirmation.  
* Provide match-result entry and match-history views.  
* Provide charts and readable empty states when no data exists.

## **5.2 Backend/API Interface**

The backend should expose REST-style endpoints. 

| Area | Example endpoints |
| :---- | :---- |
| Players | GET /api/players; POST /api/players; GET /api/players/{id}; PUT /api/players/{id}; DELETE /api/players/{id} |
| Stat categories | GET /api/stat-categories; POST /api/stat-categories; PUT /api/stat-categories/{id}; DELETE /api/stat-categories/{id} |
| Stat fields | POST /api/stat-categories/{id}/fields; PUT /api/stat-fields/{id}; DELETE /api/stat-fields/{id} |
| Player ratings | GET /api/players/{id}/stats; PUT /api/players/{id}/stats |
| Team generation | POST /api/matches/generate-teams |
| Matches | POST /api/matches; GET /api/matches; GET /api/matches/{id}; PUT /api/matches/{id}/result |
| Analytics | GET /api/analytics/players/{id}; GET /api/analytics/matches |

The team-generation request should include the selected player IDs and team size/configuration. The backend must validate the request and must not fetch all players and silently include them.

# **6\. Non-Functional Requirements**

**NFR-001 — Usability:** The manager should be able to complete common operations with clear labels, predictable navigation, and actionable validation messages.

**NFR-002 — Performance:** For a typical small-to-medium player database, common list and detail operations should normally complete within 2 seconds under normal local/development conditions. This target should be validated against the deployment environment.

**NFR-003 — Data persistence:** Confirmed player, statistic, and match changes shall persist across application restarts.

**NFR-004 — Reliability:** A failed team-generation or match-save operation shall not leave a partially saved match.

**NFR-005 — Integrity:** The system shall prevent duplicate player assignment to teams in the same match and validate all data on the backend.

**NFR-006 — Maintainability:** Keep player management, statistics, team generation, match management, and analytics in separate service/module responsibilities.

**NFR-007 — Extensibility:** The team-generation algorithm shall be replaceable without redesigning match and player-selection APIs.

**NFR-008 — Compatibility:** The interface should work in mobile viewport sizes.

**NFR-009 — Security limitation:** Authentication is intentionally excluded. The application should therefore be used only in a trusted environment; it must not be exposed publicly without adding appropriate access controls.

**NFR-010 — Backup:** The deployment should have a documented database backup and restore procedure.

# **7\. Business Rules and Validation**

| ID | Rule |
| :---- | :---- |
| BR-001 | The manager is the only intended user of the application. |
| BR-002 | Players are records, not user accounts. |
| BR-003 | A team-generation operation uses only the player IDs selected by the manager. |
| BR-004 | For two equal teams of N players, the selection must contain exactly 2N unique eligible players. |
| BR-005 | No player can be assigned to both teams in the same match. |
| BR-006 | The manager can regenerate teams before confirming the match. |
| BR-007 | Once a match is confirmed, its team membership must be persisted for history. |
| BR-008 | A completed match with equal scores is a draw; a higher score determines the winner. |
| BR-009 | Win percentage \= wins / matches played × 100\. A zero-match player has no defined percentage. |
| BR-010 | Numeric stat ratings must be between 0 and 100 inclusive; qualitative ratings must be Low, Medium, or High. |

# **8\. Use Cases**

## **UC-01: Manage a Player**

Primary actor: Manager

Precondition: The application is running.

Main flow:

1. The manager opens Player Management.  
2. The manager creates, views, updates, or deletes/archives a player.  
3. The system validates the submitted data.  
4. The system saves the changes and displays the updated player list or profile.

Alternative flow: If validation fails, the system displays the issue and does not save invalid data.

## **UC-02: Configure and Assign Player Statistics**

Primary actor: Manager

Main flow:

5. The manager creates or selects a stat category.  
6. The manager adds a field and chooses Numeric (0–100) or Low/Medium/High.  
7. The manager opens a player profile and enters a rating for the field.  
8. The system validates the value and saves it.  
9. The player profile and analytics display the saved rating.

## **UC-03: Generate Teams for a Match**

Primary actor: Manager

Precondition: Enough eligible player records exist.

Main flow:

10. The manager opens the team-generation screen.  
11. The system displays players from the database.  
12. The manager selects the players available for this match.  
13. The manager chooses the desired team size.  
14. The system validates the count and uniqueness of the selection.  
15. The system randomly shuffles only the selected players and divides them into teams.  
16. The manager reviews or regenerates the allocation.  
17. The manager confirms the match, and the system persists the match and assignments.

Alternative flow: If the selection is invalid, the system explains the required count or invalid player IDs and does not save the match.

## **UC-04: Record a Match Result**

Primary actor: Manager

18. The manager opens a scheduled or in-progress match.  
19. The manager enters each team's score.  
20. The system validates scores and determines win, loss, or draw.  
21. The manager saves the result.  
22. The system updates match history and derived player/team statistics.

# **9\. Acceptance Criteria**

| ID | Acceptance criterion |
| :---- | :---- |
| AC-01 | The manager can add a player and see the saved player in the database-backed list. |
| AC-02 | The manager can update and remove/archive a player without unintentionally deleting historical match records. |
| AC-03 | The manager can create Technical, Tactical, and Physical categories and add custom fields under them. |
| AC-04 | A numeric field accepts 0 and 100, but rejects values below 0 or above 100\. |
| AC-05 | A qualitative field accepts only Low, Medium, or High. |
| AC-06 | If 14 unique eligible players are selected for 7-vs-7, the system creates two teams of 7 using only those 14 players. |
| AC-07 | If fewer or more than the required number of players are selected for equal teams, the system prevents confirmation and explains the requirement. |
| AC-08 | No selected player appears twice or on both teams in one match. |
| AC-09 | Regenerating teams changes the allocation but does not add unselected players. |
| AC-10 | After confirmation, refreshing or restarting the application does not remove the saved match assignments. |
| AC-11 | Entering scores of 3–1 marks the first team as winner; equal scores mark the match as a draw. |
| AC-12 | Correcting a saved score updates the displayed result and calculated win/loss/draw summaries. |
| AC-13 | Player profile charts display the player's configured ratings, and match analytics reflect completed match records. |
| AC-14 | The application has no login screen or player account workflow in the initial release. |

# **10\. Future Enhancements**

* Smart team generation that balances team ratings, positions, and player roles.  
* Optimization-based balancing before or alongside AI-based recommendations.  
* Position-specific constraints and minimum goalkeeper requirements.  
* Historical rating snapshots and player improvement trends.  
* Exporting match results and player statistics to CSV or PDF.  
* Multiple groups or leagues, if required by future usage.  
* Authentication and access controls if the app is later deployed beyond a trusted local environment.

# **11\. Assumptions and Open Decisions**

* The manager is the only person using the application, and no login is required for the initial version.  
* The first release generates two teams of equal size. Support for uneven teams can be added if needed.  
* The manager chooses the available players separately for every match; player availability is not assumed to be permanent.  
* Player position is a useful profile field, but position-based balancing is not part of random generation.  
* The frontend technology, hosting environment, and final database deployment configuration remain to be confirmed.  
* The project owner should decide whether deletion means permanent deletion or archiving. Archiving is recommended for players with match history.  
* The project owner should decide whether ratings need a dated history or only the latest rating for the first release.  
* Because authentication is out of scope, deployment should remain local or otherwise restricted to a trusted network until access controls are added.


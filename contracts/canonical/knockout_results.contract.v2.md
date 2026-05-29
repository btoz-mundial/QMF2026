# knockout\_results.json Contract — v2

## Purpose

Canonical knockout-stage tournament truth.

## Real Structure

\[
{
"match\_id": 103,

&#x20;   "stage": "3P",

&#x20;   "slot": 31,

&#x20;   "round\_order": 5,

&#x20;   "status": "final",

&#x20;   "home\_team": "R Congo",

&#x20;   "away\_team": "Argentina",

&#x20;   "home\_goals": 2,

&#x20;   "away\_goals": 1,

&#x20;   "home\_penalties": null,

&#x20;   "away\_penalties": null,

&#x20;   "advance\_team": "R Congo",

&#x20;   "winner\_type": "REGULAR\_TIME"}
]

## Important Rule

match\_id represents bracket slot.

The matchup is NOT globally universal across users.
null means unresolved match.



###### **Status: has this values**

* "scheduled" means that the game hasn't been played
* "live" means that the match is currently being played
* "final" menas the match ended and results are official
* "postponed" means the match has been postponed for latter conclusion
* "cancelled" means that the game will not take place


Only Scheduled status will not generate output we can have a cancelled game with an official result or a posponed game with results




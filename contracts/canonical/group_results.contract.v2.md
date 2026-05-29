# group\_results.json Contract — v2

## Purpose

Canonical group-stage tournament truth.

## Real Structure

\[
{
"match\_id": 2,

&#x20;   "stage": "group",

&#x20;   "group": "A",

&#x20;   "status": "final",

&#x20;   "home\_team": "Korea",

&#x20;   "away\_team": "Czechia",

&#x20;   "home\_goals": 2,

&#x20;   "away\_goals": 1,

&#x20;   "result": "L"
}
]

## Rules

result values:

* "L"
* "E"
* "V"
* null

null means unresolved match.



###### **Status: has this values**

* "scheduled" means that the game hasn't been played
* "live" means that the match is currently being played
* "final" menas the match ended and results are official
* "postponed" means the match has been postponed for latter conclusion
* "cancelled" means that the game will not take place



Only Scheduled status will not generate output we can have a cancelled game with an official result or a posponed game with results




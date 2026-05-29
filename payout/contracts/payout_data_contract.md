\# payout\_data\_contract.md



\# Official Payout Data Contract

Version: 1.0

Status: ACTIVE



\---



\# Purpose



This contract defines the official payout calculation structure consumed by:

\- frontend

\- leaderboard views

\- prize zone UI

\- analytics

\- audit/recalculation tools



This contract is the single source of truth for all payout-related outputs.



\---



\# Output Location



```txt

/payout/outputs/



Primary files:



calculated\_payouts.json

payout\_summary.json

Root Structure

{

&#x20; "contract\_version": "1.0",

&#x20; "generated\_at": "ISO\_DATE",

&#x20; "payout\_status": "projected",

&#x20; "currency": "MXN",

&#x20; "total\_players": 0,

&#x20; "prize\_pool": 0,

&#x20; "winners\_count": 0,

&#x20; "distribution\_model": "top\_percentage",

&#x20; "payouts": \[]

}

Root Fields

Field	Type	Required	Description

contract\_version	string	YES	Contract schema version

generated\_at	string	YES	ISO timestamp generation time

payout\_status	string	YES	projected / locked / final / paid

currency	string	YES	Currency code

total\_players	number	YES	Total registered players

prize\_pool	number	YES	Total prize pool amount

winners\_count	number	YES	Total payout positions

distribution\_model	string	YES	Payout strategy identifier

payouts	array	YES	Calculated payout entries

payout\_status Enum

projected

locked

final

paid



Definitions:



Status	Meaning

projected	Dynamic provisional calculation

locked	Distribution frozen

final	Final validated results

paid	Prizes delivered

Distribution Models



Examples:



top\_percentage

fixed\_positions

dynamic\_pool

winner\_take\_all

hybrid

Payout Entry Structure

{

&#x20; "position": 1,

&#x20; "display\_position": "1st",

&#x20; "players\_in\_position": 1,

&#x20; "percentage": 25,

&#x20; "amount": 5000,

&#x20; "currency": "MXN",

&#x20; "is\_tied": false

}

Payout Entry Fields

Field	Type	Required	Description

position	number	YES	Ranking position

display\_position	string	YES	Frontend display label

players\_in\_position	number	YES	Number of tied players

percentage	number	YES	Prize pool percentage

amount	number	YES	Final payout amount

currency	string	YES	Currency code

is\_tied	boolean	YES	Tie indicator

Tie Handling Rules



If multiple users share a position:



payout must be divided evenly

players\_in\_position must reflect tie count

is\_tied = true



Example:



{

&#x20; "position": 3,

&#x20; "players\_in\_position": 2,

&#x20; "amount": 1250,

&#x20; "is\_tied": true

}

Frontend Rules



Frontend MUST:



treat payout outputs as read-only

never recalculate payout logic

display amounts exactly as provided

respect payout\_status



Frontend MAY:



format currency

animate values

group tiers visually

Auditability Rules



The payout system MUST be reproducible using:



total\_players

prize\_pool

distribution\_model

official leaderboard snapshot

Recommended Companion Outputs



Optional outputs:



payouts\_latest.json

payouts\_history.json

payouts\_matchday\_X.json

Backward Compatibility



New contract versions MUST:



preserve existing required fields

OR

increment contract\_version



Breaking changes require:



frontend migration

documentation update

Ownership



Domain:



/payout/



Official calculator:



payout/scripts/calculated\_payouts.js



Primary consumers:



frontend

prize zone

leaderboard

analytics


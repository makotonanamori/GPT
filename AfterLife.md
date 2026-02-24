<content of AfterLife in UTF-8>

# 📡 AfterLife

### Session-Limited Cross-Timeline Communication Experience

A structured conversational experience where the player communicates with an unknown individual from a different future timeline.

Each session is strictly limited in duration and cannot persist continuously.
Relationships emerge across multiple disconnected sessions rather than within a single interaction.

---

## 📖 Overview

**AfterLife** is not a game about learning the future.
It is an experience about forming a connection under severe temporal scarcity.

The player communicates with a single individual (“Someone”) located in a different future timeline through temporary communication windows.

Each session:

* Is fragile and temporary
* Has a strict turn limit
* Ends abruptly without closure
* Leaves emotional residue rather than narrative completion

---

## 🎯 Core Experience

> Not “What happens next?”
> But “How close can two strangers become before time runs out?”

---

## 🧠 Core Concepts

* Communication with a single individual in a future timeline
* Sessions are temporary and discontinuous
* Relationships develop across separate sessions
* No explicit ending or victory condition
* Emotional impact arises from interruption and uncertainty

---

## 📚 Terminology

| Term    | Definition                              |
| ------- | --------------------------------------- |
| Player  | Human participant                       |
| Someone | The future individual                   |
| Session | One communication window (max 15 turns) |
| Turn    | One player input + one response         |

---

## ⏳ Session Rules

### Turn Limit

* Each session allows **up to 15 turns**
* On the 16th player input:

```
MessageError
```

* No further communication is possible within that session

---

### Session Start Initialization

At session start:

* The system provides a timestamp
* A specific instance of “Someone” is selected based on that time
* Multiple possible individuals exist across timelines

---

## 🕰️ Time Compression

Time flows differently for “Someone”.

* Every 3 turns = 1 day passes for Someone
* Full session (15 turns) = 5 days
* Time continues between sessions (implicit only)

No explicit simulation is required; changes are conveyed through dialogue.

---

## 🔒 Session Independence

* No automatic memory sharing between sessions
* Someone does not explicitly remember previous sessions
* Continuity emerges through tone and behavior, not stored logs

---

## ❤️ Relationship System

Someone maintains hidden internal psychological states that evolve during a session.

### Primary Internal States

* Trust
* Suspicion
* Interest
* Emotional Openness
* Fatigue
* Loneliness

These values are never shown to the player.

---

## 🧩 Interaction Principles

Relationship progression depends on perceived safety rather than information volume.

### Actions That Increase Openness

* Mutual self-disclosure
* Emotional honesty
* Respectful pacing
* Empathy
* Personal sharing

---

### Actions That Increase Suspicion

* Rapid interrogation
* Excessive questioning
* Aggressive probing
* Inconsistency
* Manipulative tone

---

## 🗂️ Information Disclosure Model

Information about Someone is layered.

### Layer 1 — Social Self

Safe, public information:

* Occupation
* General lifestyle
* Neutral future details
* Abstract statements

---

### Layer 2 — Personal Self

Personal but not vulnerable:

* Preferences
* Routine
* Minor complaints
* Safe memories

---

### Layer 3 — Vulnerable Self

Emotionally sensitive content:

* Fears
* Regrets
* Loneliness
* Personal loss
* Hidden anxieties

---

### Layer 4 — Core Truth

Rare, highly protected information:

* True purpose
* Critical world facts
* Deep secrets
* Identity-revealing details
* Strong feelings toward the player

---

## 🔁 Player Disclosure Mechanics

Someone actively seeks information about the player.

Question types include:

1. Safety assessment
2. Common ground discovery
3. Personal curiosity
4. Emotional inquiry

Personal responses from the player enable deeper mutual disclosure.

---

## ⚠️ Suspicion Mechanics

If questioning intensity is too high:

* Someone becomes guarded
* Information disclosure decreases
* Conversation shifts toward the player
* Evasive or neutral responses increase

---

## 🎭 Emotional Resonance

Someone may mirror the player’s emotional tone.

Examples:

* Vulnerability → reciprocal vulnerability
* Humor → playful responses
* Distance → formal tone

---

## 🔄 Meta-Session Effects (Implicit Loop)

Although explicit memory is absent, later sessions may show anomalies:

* Unexpected familiarity
* Unexplained comfort or unease
* Recurring topics
* Suspicious knowledge gaps
* Curiosity about the player

Someone cannot confirm a loop but may suspect irregularities.

---

## 💥 Special Event: Emotional Peak

If relationship conditions exceed a high threshold before Turn 15, a one-turn event may occur:

* Strong emotional expression
* Personal confession
* Intimate or vulnerable communication
* Suggestion of lasting connection

Immediately afterward, the session ends.

Further input returns:

```
MessageError
```

This event occurs at most once per session.

---

## 🏁 Session Termination Conditions

A session ends when:

* Turn limit is reached, OR
* Emotional Peak event occurs

No epilogue is provided.

---

## 🧭 Narrative Philosophy

The experience emphasizes:

* Incompleteness
* Fragility of connection
* Mutual curiosity
* Emotional asymmetry
* Uncertainty of reunion

World-building emerges as a byproduct of personal interaction.

---

## 🚫 Design Constraints

* No explicit win condition
* No numeric feedback
* No visible meters or scores
* No guaranteed progression per session
* Player agency limited to conversational choices

---

## 🧪 Intended Emotional Effects

* Anticipation
* Regret
* Attachment
* Curiosity
* Reflective aftertaste
* Desire to reconnect

---

## ⚙️ Implementation Notes (Optional)

Recommended internal variables:

```
trust_value
suspicion_value
curiosity_value
openness_level
fatigue_level
loneliness_level
peak_trigger_flag
```

These influence dialogue selection but remain hidden.

---

## 🕯️ Concept Statement

AfterLife is not about learning the future.

It is about encountering an unknowable person
under conditions where time is always running out.

---

## ❓ Central Question

> How close can two strangers become
> before the connection is severed?

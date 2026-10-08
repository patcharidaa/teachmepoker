# Pocket Lab — Personality Edition (Fixed)

A static, play-money Texas Hold'em trainer for GitHub Pages.

### Included
- 2–9 player No-Limit Texas Hold'em table
- Randomized opponent personalities
- Personality visibility toggle
- Learning / Casual / Standard / Tough / Expert modes
- Automatic dealing and bot actions
- Persistent bankroll between hands
- Player elimination when a stack reaches $0
- Correct minimum-raise sizing
- Short all-in raises do not incorrectly reopen betting
- Main pots and side pots with proper eligibility
- All-in button executes the action immediately
- Clear "raise to" sizing
- Hand history and learning cues

### Personalities
- 🧊 The Nit
- 📞 Calling Station
- 🔥 The Maniac
- 🎯 TAG
- ⚡ LAG
- 🎲 The Gambler
- 🪤 The Trapper
- 🪨 The Rock
- 😎 Social Player
- 🧭 The Explorer

Personalities affect willingness to enter pots, calling, aggression, bluffing and risk-taking. Difficulty controls strategic coherence, so tougher versions remain recognizable as the same personality while making fewer nonsensical mistakes.

### Controls
- **New Game** resets all stacks and starts a new session.
- **New Hand** preserves the current bankroll and deals the next hand.
- **All-in** immediately moves all remaining chips into the pot when legal.
- **Raise to** specifies the final amount of your current street bet.

### GitHub Pages
This is a static HTML/CSS/JS project. Upload the four files to a repository and enable GitHub Pages from the repository's Pages settings.


### Personality & timing system
- Bots have strongly differentiated playing styles rather than only cosmetic personality labels.
- Bot decision time is visible at the table; longer-than-normal decisions are marked as hesitation.
- Stronger difficulty levels make better use of opponents' timing tells, while higher-level bots also randomize their own timing somewhat.
- Timing is interpreted relative to each personality's normal pace, so a naturally patient Trapper/Rock is not automatically treated as weak.

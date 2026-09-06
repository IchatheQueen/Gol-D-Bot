# Making SlotBot Customs (and getting paid for them)

Written 2026-08-08. Sources: SlotHub `#📋│updates` (full 2017→2026 history), live
custom usage observed in Olympus `#cmds`, and the ccmd management surface mirrored
in your own bot.

**Confidence markers used below:** ✅ verified from the official changelog/TOS ·
🔍 inferred from observed behaviour · ❓ I could not confirm — check before relying on it.

---

## 1. What a "custom" actually is

Two different products get called customs. Know which one you're selling.

**Custom commands / cosmetics (`~ccmd*`)** — a reskin of an existing command. The
mechanics don't change at all; you are replacing the *flavour text* SlotBot prints
when someone uses a weapon or action. ✅

**Custom roles (`~cstmrl*`)** — a Discord role in the support server, with a name
and colour, owned by you and sellable. ✅ Separate system, same ownership model.

The money is mostly in the first one.

---

## 2. Anatomy of a cosmetic

Every weapon prints a short message sequence. A cosmetic swaps those lines for
yours. Here are the real defaults, pulled from live usage in Olympus:

| Command | Default message | Msgs |
|---|---|---|
| `~hex` | `{user} has hexed {target} and stolen 💵 {amount}, stunning them for {N} minutes in the process!` | 1 |
| `~hex` (miss) | `{user} has attempted to hex {target} to no effect` | 1 |
| `~boost` | `{user} has boosted {target} into the sky and stolen 💵 {amount}, knocking them unconscious for {N} minutes in the process!` | 1 |
| speaker | `{user} has shot a stream of high pitched vibrations at {target} using their {emoji}, shattering 🍺 {amount} and knocking you unconscious for {N} minutes.` | 1 |
| flamethrower | `{user} has opened fire on {target} using their {emoji}...` **then** `🌿 {amount} from {target}'s farm have gone up in smoke` | 2 |
| `~select` | `{user} has switched to their {weapon}` | 1 |
| `~drink` | `{user} has loaded themselves with {emoji} and taken a nice long nap` | 1 |
| `~smoke` | `{user} has rolled up a blunt of {emoji} and smoked it` | 1 |
| `~pet` | `{user} has pet their [Lvl {n}] {CatAlias} and done absolutely nothing because the [Lvl {n}] {CatAlias} was already ready to be fed` | 1 |
| pet exhausted | `{user}'s [Lvl {n}] {CatAlias} has become too tired to protect its owner or grab IDs` | 1 |

All of the above were captured from live combat, so the **Msgs** column is a count of
what SlotBot actually emits today, not a guess. ✅

> **Excluded:** SlotBot's `{user} has disabled {target}'s weapons for {N} minutes due
> to a continuous barrage of attacks!` line is part of the **Chained** combat system
> (it's the 5-stack "disable their will to fight" effect), which GoldBot does not
> implement. Listed here only so it isn't mistaken for a reskinnable weapon message.

And here is an actual **custom** caught in the wild, for contrast:

> A glass shatters nearby and suddenly an Mk1 Grenade rolls towards you. The
> explosions knocks the you to the floor and you taste blood in your mouth.

Note what changed: no stats, no numbers, pure atmosphere, written in second person
at the victim. Note also the typos — "the explosions knocks the you" — which is
exactly the sort of thing that makes a custom feel amateur. Yours shouldn't have them.

### Alias types that exist ✅

From the market announcements, these are the slots people actually buy:

Cat Alias · Cat Alias (transform) · Hex · Attack · Protect · Grabids · Speaker ·
Flamethrower · Hunt · Drink · Smoke · Feed Pill

A **transform** alias is worth noting: Griffith turns into Femto while a Cat Pill
status effect is active. That two-state trick is a genuine differentiator. ✅

**Cat Alias is the highest-value slot, and it isn't close.** ✅ A cat alias renames
the pet everywhere it appears, not just in one command. Caught live in Olympus, a
user with a `Hellhound` alias produces:

> `[Lvl 20] Hellhound` — Tamed by @eqzerv
> `katerina has pet their [Lvl 20] Hellhound and done absolutely nothing…`
> `katerina's [Lvl 20] Hellhound has become too tired to protect its owner or grab IDs`

That's the stat panel, the pet interactions, the exhaustion notices, level-ups and
protect messages — one purchase, visible constantly. Compare that to a hex alias
that only shows when the buyer attacks someone. **This is why cat aliases sell for
$5 and drink aliases sell for $3.**

---

## 3. The rules you must build against

This is the part that decides whether your custom survives. Every one of these is
from the official changelog or TOS.

**Message count limits.** ✅ SlotBot has been actively *reducing* how many messages
weapons emit — rifle in Apr 2025, beatup and flamethrower in Apr 2026. Both times,
third-party cosmetics that didn't fit the new budget were **switched off** until
their owners worked with staff to re-comply. Six named cosmetics (`tailwhip`, `ak`,
`bless`, `bombard`, `jtr`, `obliterate`) got disabled in one go.

> **Design rule: write tight.** A custom that needs five messages to land its joke
> is a custom that gets disabled in the next spam-reduction pass.

**The budget is 1–2 messages, and that's now measured, not guessed.** ✅ Across every
weapon observed live in Olympus, hex, boost, speaker, select, drink and smoke each
emit exactly **one** message; flamethrower is the only one at **two** (the attack
line, then the farm-damage line). Write to one message and you are always safe;
write to two only if you're reskinning flamethrower.

**No deceptive messaging.** ✅ (TOS, enforced from 2026-01-12.) You may not use
custom text to imply something different from what happened — inflating the amount
stolen, or faking a chain/stun duration. This is explicitly called out.

**Content policy.** ✅ Names and text must comply. Assume the same bar as `~petname`.

**Keyword cosmetics need the weapon selected.** ✅ (2025-04-26.) If your custom is
invoked as `~yourkeyword` instead of `~shoot`, the user must `~select` the
underlying weapon first. Worth telling buyers up front — it's a common "it doesn't
work" complaint.

---

## 4. Ownership and access — the commands

This is the machinery you'll use to deliver what you sell. ✅

| Command | What it does |
|---|---|
| `~ccmdown` | Lists customs you **fully own**. This is your proof of ownership. |
| `~ccmds` | Lists customs you have management permissions on |
| `~ccmd <target> <key>` | **Grants/takes access** — this is the actual "delivery" step when someone buys |
| `~ccmdclaim <key>` | Claims co-ownership + access over a custom you own |
| `~ccmdadd <target> <key>` | Grants **management** access (not just use) |
| `~ccmdtake <target> <key>` | Revokes management access |
| `~ccmdtransfer <target> <key>` | Full ownership transfer — **cannot be undone** |
| `~ccmdpurge <key>` | Wipes all access and co-ownership. **Costs $4.00 DCRED** |

Custom roles use the same shape: `~cstmrlown`, `~cstmrlclaim`, `~cstmrltransfer`,
`~cstmrlpurge`.

Since 2024-12, `~ccmdadd`/`~ccmdtake` (and the cstmrl equivalents) can only be used
by the **owner** — people you gave management to can no longer spread management
further. ✅ Good for you as a seller: your permissions can't leak.

---

## 5. The two ways customs make money

### Route A — get it into the official market

SlotBot sells cosmetics itself and credits the creator by name in the announcement
("By @⩔ lust", "By @✨Milton✨"). ✅

Observed official pricing: ✅

- Panda (Cat Alias) — **$5.00 USD**
- Wine (Drink Alias) — **$3.00 USD**

So the going rate is roughly **$3 for a simple single-command alias, $5 for a cat
alias**. Seasonal/limited items exist too (`~market limited`) — Easter Bunny,
Freeze-Ray — which are sold only during a window and are a good hook for scarcity.

❓ **I could not verify the revenue split.** The changelog only ever shows the
finished announcement.

The **contact route is confirmed**, though: ✅ SlotBot's own account-lock notice tells
users to "make a support ticket in our Support Server by private messaging
**SBSupport**". That's the same channel staff mean when they say "contact support to
work with us" about cosmetics. So SBSupport is who you talk to.

🔍 **Ask them the split before you build anything.**

### Route B — sell access yourself (third-party)

This is explicitly permitted, and it's the faster path. ✅ TOS, Third-Party
Purchase Policies:

> You may not sell SlotBot currencies, items, products or services for real world
> money (RMT). **Third party purchases dealing with custom commands, aliases, or
> support server roles are allowed** provided all criteria are met.

The criteria, all three required: ✅

1. You **fully own** the custom and it appears on your `~ccmdown` / `~cstmrlown`
2. You **may not revoke** a buyer's access for any reason before refunding in full
3. Ownership must be on **the account you're selling from** — selling something
   held on an alt is treated as selling something you don't own

You deliver with `~ccmd <buyer> <key>`. You are selling *access*, not ownership —
you keep the custom and can sell it again to the next person. That's the whole
business model: build once, sell access repeatedly.

---

## 6. What gets you blacklisted

Take this seriously; it's the difference between income and a dead account. ✅

- **Selling then reclaiming.** Revoking access from someone who paid, without a full
  refund, is a straight SlotBot blacklist. Called out by name in the custom-role
  announcement.
- **Selling from the wrong account.** If the custom is on an alt, you're treated as
  not owning it.
- **Selling currency or items for cash.** Customs, aliases and roles are the *only*
  sellable things. Selling in-game money is RMT and is banned.
- **Deceptive custom text.** See §3.

Also: ✅ since 2025-03, `~ccmdown` shows buyers a warning about third-party
purchases. Buyers are being actively told to be careful, so your reputation is the
product as much as the custom is.

**Enforcement is real and visible.** ✅ Two separate account locks turned up in a
single server's history:

> **Account Under Investigation** — `{user}`'s account has been locked due to a
> violation of SlotBot's Terms of Service being investigated. Please make a support
> ticket in our Support Server by private messaging SBSupport.

Note the shape of it: the account is locked *while the investigation runs*, not
after a verdict. If your income depends on that account, a suspicion alone takes it
offline. Keep your selling clean and keep it on one account.

---

## 7. A practical playbook

1. **Pick a slot with traffic.** Measured from Olympus `#cmds`: the commands people
   actually run are `~hex`, `~boost`, `~shoot`, `~select`, `~drink`, `~smoke`,
   `~feed`, `~cat`, `~catalias` and `~execute`/`~exec`. Hex and the shoot/select
   pair dominate. A gorgeous `~feed pill` custom gets seen a tenth as often as a
   mediocre hex one — and a **cat alias** beats them all, because it shows up
   without the buyer attacking anyone. Visibility sells the *next* copy.
2. **Write for the victim, not the attacker.** The strong custom above is aimed at
   the person being hit ("rolls towards *you*"). It lands harder.
3. **Stay inside two messages.** See §3. Assume another spam-reduction pass is coming.
4. **Don't touch the numbers.** Let SlotBot print the amounts. Editing them is the
   one thing guaranteed to be a TOS violation.
5. **Have a theme, not a joke.** Griffith→Femto sold because it's a *set* (cat +
   protect + hex + feed pill, all matching). Sets let you sell four things to one
   buyer.
6. **Proofread.** Typos are what separate a $5 custom from a free one.
7. **Sort the money question first.** Confirm the market split with staff (Route A)
   before investing effort, or just run Route B yourself where you keep everything.

---

## 8. Open questions to ask staff

Things I genuinely could not determine from the available history — worth a ticket
before you commit time:

- ❓ Revenue split for the official market (ticket **SBSupport** — route confirmed)
- ❓ Whether there's a fee to have a custom created/registered in the first place
- ❓ Whether animated/GIF cosmetics are still accepted — one existing cosmetic
  ("Hover") broke when Tenor changed its CDN, so external media is clearly fragile

*Resolved since first draft: the per-weapon message budget is 1–2, measured from
live output (§3), and SBSupport is confirmed as the contact route (§5).*

# Overview

Cogo is a mobility super-app for Belgium — parking, shared scooters and bikes, public transport, EV charging, route planning and navigation, all in one place. I joined Mayten Technologies as the sole designer and have been the person responsible for how the product looks, feels and flows ever since.

This isn't a single-project case study with a clean start and end. Since January 2026 I've been continuously redesigning existing features, designing new ones from scratch, and building the visual language that ties the product and its marketing together — shipping to a live, growing user base the whole time.

<figure class="cs-wide">
  <img src="/case-studies/cogo/marketing-parking.jpg" alt="Cogo marketing key visual: The best parking app in Belgium" />
  <figcaption>One of the marketing key visuals built on the redesigned visual language.</figcaption>
</figure>

## My role

I work as the sole product and creative designer, owning everything from UX flows and UI to the marketing and brand output. Day to day I collaborate directly with the product owner, the CEO and the developers — which meant most decisions were a negotiation between user needs, business direction and what was realistic to build.

# The challenge

## Designing without a safety net

Cogo is a startup, and I designed under the constraints that come with that:

- **No research budget** and unreliable analytics — I couldn't lean on clean quantitative data to make decisions.
- **No formal user testing** from the company, so I ran my own sessions with a group of personal testers to pressure-test flows before they shipped.
- **No budget for a dedicated design system** or documentation, so consistency had to be maintained by hand while still moving fast.
- **Specific brand constraints from the CEO** — for example, no hands in any marketing material — that shaped the visual direction.

The through-line: every design decision carried a real cost, and the best solution was usually the one that could actually ship given the time, budget and technical limits I was working within.

## The core UX problems

Without a research budget, I built my picture of the problems from the signals I could get: recurring themes in support tickets, patterns in app-store reviews, direct conversations with the product owner, and my own moderated sessions with a group of personal testers. Triangulating those sources, three problems showed up again and again:

- **Unclear hierarchy** — screens gave equal weight to everything, so nothing stood out and users didn't know where to look first.
- **Cognitive overload** — dense screens tried to say too much at once.
- **Unclear touchpoints** — key interactive elements didn't read as tappable, so people missed actions that were right in front of them.

None of this was backed by clean quantitative data, so I treated it as directional rather than definitive — and leaned on my testers to confirm a problem was real before committing to a redesign, and to sanity-check the fix before it shipped.

The old home screen is a good snapshot of where things started: a busy map, competing controls, and a dated visual language that didn't guide the eye anywhere in particular.

<figure class="cs-shots">
  <figure class="shot">
    <span class="shot-tag shot-tag--before">Before · legacy</span>
    <img src="/case-studies/cogo/home-old.png" alt="Legacy Cogo home screen with dense map and dated elements" />
  </figure>
</figure>

<p style="text-align:center; font-family: var(--font-mono); font-size:11.5px; color: var(--text-muted); letter-spacing:0.04em;">The legacy home screen — the visual language and hierarchy I set out to rework.</p>

# Redesigning the parking flow

Parking is Cogo's core loop, so the payment flow was the highest-leverage thing to fix. The legacy screen packed the session code, tariff, timing, fees and total into one cramped view with a flat hierarchy — the price breakdown and the primary action competed for the same attention, and it wasn't obvious what to tap to actually start parking.

How I knew it mattered: parking is the action people open Cogo to do, and confusion here is the most expensive kind — a fumbled payment flow is a lost session. Testers consistently paused on the legacy screen to work out what was tappable, which told me the problem was hierarchy, not content.

I rebuilt the flow around a clear vertical hierarchy and one unmistakable primary action. Personal and Business are now a clean segmented toggle at the top, duration is a single tactile slider with the end time surfaced live, and the cost breaks down transparently — parking fee, service fee, discounts — into a total that sits directly above a high-contrast **Start Parking** button. Every screen now answers "what do I do next?" in one glance, and testers moved through the reworked flow without stopping to hunt for the action.

<figure class="cs-shots">
  <figure class="shot">
    <span class="shot-tag shot-tag--before">Before</span>
    <img src="/case-studies/cogo/parking-before.png" alt="Legacy parking payment screen with flat hierarchy" />
  </figure>
  <figure class="shot">
    <span class="shot-tag shot-tag--after">After</span>
    <img src="/case-studies/cogo/parking-after-1.png" alt="Redesigned parking screen with duration slider" />
  </figure>
  <figure class="shot">
    <span class="shot-tag shot-tag--after">After</span>
    <img src="/case-studies/cogo/parking-after-2.png" alt="Redesigned parking screen with transparent cost breakdown" />
  </figure>
</figure>

<p style="text-align:center; font-family: var(--font-mono); font-size:11.5px; color: var(--text-muted); letter-spacing:0.04em;">Before (far left) versus after: the same task, rebuilt around one clear action and a transparent, scannable cost breakdown.</p>

# Reworking the transit view

Public-transport departures had the same problems as parking, in a different shape. The legacy view dropped users into a dark, dense list of stops and times with little visual structure — every row looked the same, route numbers were hard to scan, and it was tough to tell what mattered at a glance.

I anchored the redesign on the one question people open a departures view to answer — "which line, from which stop, and how soon?" — and designed everything else to defer to it. The redesign leads with a clear stop header and colour-coded route badges, then breaks each line into a scannable card with its next arrival. Tap through and you get the specifics — upcoming departures, a visual stop-by-stop timeline of the route, and the option to start a **Pulse** so the live journey follows you the same way a parking session does.

<figure class="cs-shots">
  <figure class="shot">
    <span class="shot-tag shot-tag--before">Before</span>
    <img src="/case-studies/cogo/bus-before.png" alt="Legacy transit departures, dense dark list" />
  </figure>
  <figure class="shot">
    <span class="shot-tag shot-tag--after">After</span>
    <img src="/case-studies/cogo/bus-after-list.png" alt="Redesigned transit stop view with colour-coded route badges" />
  </figure>
  <figure class="shot">
    <span class="shot-tag shot-tag--after">After</span>
    <img src="/case-studies/cogo/bus-after-detail.png" alt="Redesigned line detail with departures and stop timeline" />
  </figure>
</figure>

<p style="text-align:center; font-family: var(--font-mono); font-size:11.5px; color: var(--text-muted); letter-spacing:0.04em;">Before (left): the flat legacy departures list. After: a scannable stop view with route badges, and a line detail with a full route timeline.</p>

Getting there took a few passes. Early iterations of the line detail tried different framings for the same data — how to label departures, whether to lead with upcoming stops or the full schedule, how much of the route to show before asking the user to expand. I kept the version that let people confirm "is my bus coming" fastest, and pushed everything else behind a tap.

<figure class="cs-shots cs-dropped">
  <img src="/case-studies/cogo/bus-iter-1.png" alt="Early bus iteration, stop list working state" />
  <img src="/case-studies/cogo/bus-iter-2.png" alt="Early bus line detail iteration with upcoming stops / full schedule toggle" />
</figure>

# Pulse: designing for a constraint before it hit

Pulse is Cogo's Apple Live Activity — the live parking session that lives on the lock screen and in the Dynamic Island. My ideal design used a curved, arc-shaped progress indicator sweeping over the remaining time: distinctive, and a nice branded moment on the lock screen.

But I anticipated that the arc would run into technical constraints — Live Activities are tightly limited in what they can render, and a custom curved progress animation was likely more than the format could comfortably support. So rather than design one beautiful thing and hand development a problem, I designed the fallback in parallel: a cleaner, linear progress version built on components that would be straightforward to implement.

When the constraint materialised exactly as expected, we already had the shippable answer ready — no scramble, no compromise made under pressure. The linear version went live; the arc stayed a concept.

<figure class="cs-shots cs-dropped">
  <img src="/case-studies/cogo/pulse-arc-start.png" alt="Pulse Live Activity concept with curved arc progress, start state" />
  <img src="/case-studies/cogo/pulse-arc-active.png" alt="Pulse Live Activity concept with curved arc progress, active session" />
</figure>

<figure class="cs-shots">
  <figure class="shot">
    <span class="shot-tag shot-tag--shipped">Shipped</span>
    <img src="/case-studies/cogo/pulse-linear-start.png" alt="Shipped Pulse Live Activity, linear layout, start state" />
  </figure>
  <figure class="shot">
    <span class="shot-tag shot-tag--shipped">Shipped</span>
    <img src="/case-studies/cogo/pulse-linear-active.png" alt="Shipped Pulse Live Activity, linear progress bar, active session" />
  </figure>
</figure>

<p style="text-align:center; font-family: var(--font-mono); font-size:11.5px; color: var(--text-muted); letter-spacing:0.04em;">Top: the arc concept I loved but expected to be un-buildable. Bottom: the linear version I designed alongside it, which shipped.</p>

# City summaries: designing for progressive disclosure

The city summary feature gives users transport, micromobility and travel context for wherever they are — which is a lot of information to present without overwhelming anyone. This section is the clearest example of how I worked the cognitive-load problem across several iterations, not in one move.

My first version was a full-screen takeover. It was rich, but it was exactly the kind of dense, information-heavy screen I was trying to design *out* of the product everywhere else — everything landed at once, and it pulled users off the map entirely.

Moving to a bottom-sheet modal fixed the "takeover" problem, but early modal iterations still had the hierarchy wrong: the operator description, the transport/micromobility toggle and the provider cards all competed for attention in a flat stack, so the sheet still felt heavy the moment it opened.

The decision that made it work was switching the hierarchy to lean on **progressive disclosure**. The toggle leads, so users pick their intent first. Providers collapse into compact cards that expand only when tapped. Long descriptions hide behind "Read more" instead of filling the sheet. Each layer only appears when it's asked for — so the surface stays calm, and the map stays visible behind it.

<figure class="cs-shots cs-dropped">
  <img src="/case-studies/cogo/city-fullscreen.png" alt="Dropped full-screen city summary, dense layout" />
  <img src="/case-studies/cogo/city-iter.png" alt="Early modal iteration with flat hierarchy" />
</figure>

<p style="text-align:center; font-family: var(--font-mono); font-size:11.5px; color: var(--text-muted); letter-spacing:0.04em;">Explored and dropped: the full-screen takeover (left) and an early modal with a flat, competing hierarchy (right).</p>

<figure class="cs-shots">
  <figure class="shot">
    <span class="shot-tag shot-tag--shipped">Shipped</span>
    <img src="/case-studies/cogo/city-modal.png" alt="Shipped city summary modal built on progressive disclosure" />
  </figure>
</figure>

<p style="text-align:center; font-family: var(--font-mono); font-size:11.5px; color: var(--text-muted); letter-spacing:0.04em;">Shipped: toggle-led, with providers and descriptions collapsed until the user asks for them.</p>

# Designing new features from scratch

Alongside redesigns, I designed several features from the ground up — working in high fidelity and iterating quickly with AI, which is how I keep pace as a one-person design team on a startup timeline.

## Routing & AI recommendations

Multi-modal routing lets users plan a journey across car, transit, scooter, bike and walking, with results that spell out each leg — a 4-minute walk, a Dott scooter, a 6-minute walk — plus context like ETA, distance, climb and whether the route sticks to protected bike lanes.

On top of that sits an AI layer: instead of fiddling with filters, users describe the journey they want in plain language — "show me the scenic route", "avoid busy roads", "pass by a coffee shop" — and Cogo refines the route to match. The natural-language input is the primary interaction, with a few suggested prompts to show people what they can ask for.

<figure class="cs-shots">
  <img src="/case-studies/cogo/routes.png" alt="Multi-modal routing results with per-leg breakdown" />
  <img src="/case-studies/cogo/routes-ai.png" alt="AI journey input — describe your ideal journey in natural language" />
</figure>

<p style="text-align:center; font-family: var(--font-mono); font-size:11.5px; color: var(--text-muted); letter-spacing:0.04em;">Multi-modal routing (left) and the AI layer (right): describe the journey you want, and Cogo builds it.</p>

## Turn-by-turn navigation

A new navigation experience with a focused active-guidance view — the current instruction, mode, speed and ETA — and an expandable full directions list one tap away.

<figure class="cs-shots">
  <img src="/case-studies/cogo/nav-active.png" alt="Turn-by-turn navigation, active guidance view" />
  <img src="/case-studies/cogo/nav-directions.png" alt="Navigation with expanded full directions list" />
</figure>

<p style="text-align:center; font-family: var(--font-mono); font-size:11.5px; color: var(--text-muted); letter-spacing:0.04em;">Navigation: focused active guidance, with the full step list one tap away.</p>

# A unified visual & marketing language

With no budget for a formal design system, I still had to make the product and its marketing feel like one coherent brand. I developed a reworked visual language for Cogo and extended it into cohesive, unified marketing — key visuals, campaign creative, and a physical presence.

<figure class="cs-wide">
  <img src="/case-studies/cogo/marketing-tripplanner.jpg" alt="Your city, your way — Cogo campaign key visual" />
  <figcaption>Campaign creative built on the unified visual language that runs across product and marketing.</figcaption>
</figure>

<figure class="cs-wide">
  <img src="/case-studies/cogo/marketing-ai.png" alt="Smarter trips with AI — campaign key visual" />
  <figcaption>The same visual language carried into feature marketing for the AI routing layer.</figcaption>
</figure>

## From sketch to conference floor

The clearest end-to-end example is the **backwall and stand I designed for the MME conference** — working within specific brand constraints from the CEO, such as no hands in any marketing material. It started as a rough layout sketch, became a full 5.9m-wide printed design carrying the product's own UI and route motif, and ended up built and standing on the conference floor.

<figure class="cs-shots">
  <img src="/case-studies/cogo/backwall-sketch.jpg" alt="Hand sketch planning the conference backwall layout" />
  <img src="/case-studies/cogo/conference-photo.jpg" alt="The finished Cogo booth built at the MME conference" />
</figure>

<figure class="cs-wide">
  <img src="/case-studies/cogo/backwall-design.png" alt="Final printed backwall design, 5.9m wide" />
  <figcaption>Sketch → final 5.9m backwall design → the built booth at MME. The conference presence gave Cogo real visibility and, the team credits, helped open conversations that led to new partnerships and investor interest.</figcaption>
</figure>

## Where the brand is heading

Right now I'm exploring a **more expressive, experimental and louder** direction for the marketing visual language — pushing past the clean product look into bolder photography, heavier type and more attitude, starting with the launch of Cogo's business tier.

<figure class="cs-shots">
  <img src="/case-studies/cogo/marketing-business-1.jpg" alt="Cogo for Business campaign visual — bold direction" />
  <img src="/case-studies/cogo/marketing-business-2.jpg" alt="Cogo for Business campaign visual — bold direction" />
</figure>

<p style="text-align:center; font-family: var(--font-mono); font-size:11.5px; color: var(--text-muted); letter-spacing:0.04em;">Current exploration: a louder, more expressive marketing language, launching with Cogo for Business.</p>

# Outcome

I was the sole designer, not the whole company, so I'm careful about what I claim. Growth is driven by many things — engineering, pricing, market timing, partnerships — and it would be dishonest to pin it on design alone. What I can say is the direction the product moved while I owned its design, and the specific outcomes I contributed to directly.

**Context:** during the period I've been designing Cogo, the app has grown its user base by roughly 19% and expanded into new regions across Belgium, the Netherlands and Germany. Design was one input among several, but the product people were adopting and using across those markets was the one I was shaping.

**Directly attributable:** the MME conference presence — the backwall and stand I designed — gave Cogo tangible visibility at the event, which the team credits with helping open conversations that led to new partnerships and investor interest. That's the outcome closest to my own work.

Where I'm most confident, though, is at the interaction level: in testing, people moved through the reworked flows without the hesitation the old screens produced, and the redesigned parking, transit and city-summary experiences replaced the exact patterns that were generating confusion before.

## What I'd do differently

More testing, earlier. Time and budget pushed me to iterate fast in high fidelity and lean on my own testers, and it worked — but the decisions I'm most confident about were the ones I could actually put in front of people. Given more room, I'd build structured testing into both the product design (screens and flows) and the earlier concept stages, so more calls are backed by evidence rather than judgment alone.

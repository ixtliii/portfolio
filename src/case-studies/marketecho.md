# Overview

MarketEcho is an analytical dashboard for crypto and forex traders — a single surface that turns dense, real-time market data into fast, confident decisions. The brief was deceptively hard: pack in a huge amount of information without drowning the user in it. My goal was to reduce cognitive load through a scalable design system and a high-contrast, hierarchy-driven UI.

<p class="cs-tldr"><strong>At a glance —</strong> a solo, end-to-end product design project: audience strategy, a fully tokenized design system, and the complete UI across four connected surfaces — trading app, dashboard, affiliate/admin, and marketing site. It launched with 100+ users on day one. <a href="https://marketecho.io/" target="_blank" rel="noopener noreferrer">Visit the live site ↗</a> &nbsp;·&nbsp; <a href="https://www.behance.net/gallery/241398813/MarketEcho-Web-App-UXUI" target="_blank" rel="noopener noreferrer">See it on Behance ↗</a></p>

<figure class="cs-wide">
  <img src="/case-studies/marketecho/hero.png" alt="MarketEcho analytical dashboard shown on a laptop" />
  <figcaption>MarketEcho — an analytics dashboard built to make complex market data legible at a glance.</figcaption>
</figure>

## My role

I designed MarketEcho end to end — stakeholder and audience analysis, the design system, the trading dashboard, the affiliate and admin surfaces, every supporting screen, and the marketing site. It spans four connected surfaces (app, dashboard, affiliate/admin, and web), all built on one system.

# Who it's for

Rather than design for a generic "trader", I split the audience into three distinct roles and tailored the UI and data density to each. Segmenting the experience this way is what kept every surface focused instead of trying to serve everyone at once.

<figure class="cs-wide">
  <img src="/case-studies/marketecho/personas.png" alt="Three user personas: trader, content creator, operations lead" />
  <figcaption>The three roles that shaped the product: a power-user trader, an influencer, and an operations lead.</figcaption>
</figure>

**Elias, 29 — the professional day trader.** Analytical and tech-savvy, six to eight hours a day in front of screens. Values speed, precision and customization, and needs a "flow state" where the tools don't get in the way. His pain points were visual noise, latency, and no way to prioritize data. He needs to spot trends instantly, act fast, and bend the charts to his own strategy.

**Chloe, 26 — the financial content creator.** Community-driven; her reputation is her currency. She monetizes through referrals and needs the product to look professional enough to share. Her pain points were unclear referral and earning data, an ugly UI, and general complexity. She needs to track commissions, share wins that look good, and onboard new users easily.

**David, 38 — the operations lead.** The backbone of the platform, focused on security, organization and efficiency. He processes KYC verifications and manages permissions, and can't afford errors. His pain points were disorganization, slow workflows and a lack of control. He needs to handle verifications and tickets efficiently and keep a high-level view of system health.

# The design language

With four surfaces and a small dev team, designing screen-by-screen would have produced chaos. I invested up front in a scalable design system — a component library, a tokenized color system, typography rules and usage guidelines — so the team could build once and stay consistent everywhere.

The foundation is **Manrope** for its clarity at small sizes and dense data, and a tight, high-contrast palette: Mist White (`#F0F1F3`), Midnight Black (`#2A313A`) and Alpine Green (`#0B835C`) as the signal color for gains, actions and emphasis.

<figure class="cs-wide">
  <img src="/case-studies/marketecho/design-system.png" alt="MarketEcho design system: typeface, color palette and system stats" />
  <figcaption>Manrope, a three-color core palette, and a fully tokenized component library.</figcaption>
</figure>

The system covers **40+ components**, **300+ variants**, and is **100% tokenized** — every color, type style and spacing value defined once and themed everywhere. Note: full design-system documentation is under NDA and can't be shown publicly here.

# The dashboard

The dashboard is where the cognitive-load problem is hardest. It has to surface an enormous amount of market data — session direction, high/low potential, pip extensions, day type, previous-day levels — without overwhelming a trader mid-decision.

Two decisions carried it. First, a **modular card system** the user fully controls: widgets can be toggled and rearranged, so each trader builds the distraction-free layout that matches their style rather than living with mine. Second, **grouping data by market session** — Asia, London, New York — so the wall of numbers becomes three legible, comparable blocks instead of one undifferentiated grid.

<figure class="cs-wide">
  <img src="/case-studies/marketecho/dashboard.png" alt="MarketEcho trading dashboard with modular session cards" />
  <figcaption>A customizable, card-based dashboard — data grouped by session to cut the noise.</figcaption>
</figure>

<figure class="cs-shots">
  <img src="/case-studies/marketecho/session-cards.png" alt="Session metric cards for London and New York" />
</figure>

<p style="text-align:center; font-family: var(--font-mono); font-size:11.5px; color: var(--text-muted); letter-spacing:0.04em;">Each session card leads with the decision — direction and probability — with the supporting detail underneath.</p>

Because the system is tokenized end to end, the same session logic and components collapse cleanly onto a phone — a trader gets the identical read on the go, without a separately maintained mobile design.

<figure class="cs-wide">
  <img src="/case-studies/marketecho/mobile.png" alt="MarketEcho session metrics on mobile" />
  <figcaption>The same session view on mobile, built from the same components as the desktop dashboard.</figcaption>
</figure>

# The affiliate board

For Chloe's role, the problem was trust: influencers need to believe the numbers before they'll promote the product. The affiliate board leads with **visual progress toward the next commission tier** to drive growth, backed by a **full, transparent payment history** so earnings can be verified at a glance.

<figure class="cs-wide">
  <img src="/case-studies/marketecho/affiliate.png" alt="Affiliate board with earnings, progress and payout history" />
  <figcaption>The affiliate board: progress to the next tier up top, verifiable payout history below.</figcaption>
</figure>

To make progression motivating rather than administrative, I designed a **five-tier badge system** — Bronze, Silver, Gold, Platinum, Diamond — that gamifies the journey. The badges give influencers an instant read on their status and a visible next rung to unlock, rising from a 5% commission at Bronze to 20% at Diamond.

<figure class="cs-wide">
  <img src="/case-studies/marketecho/badges.png" alt="Five affiliate tier badges from Bronze to Diamond" />
  <figcaption>A gamified tier system, from Bronze (5%) to Diamond (20%).</figcaption>
</figure>

# The supporting screens

Around the two hero surfaces sits everything that makes the product real — settings, personal information and privacy, a tiered subscription flow, referrals, and a searchable knowledge base. All of it draws on the same components, so a screen the user sees once still feels like part of one product.

<figure class="cs-shots">
  <img src="/case-studies/marketecho/settings.png" alt="Settings and subscription screens" />
  <img src="/case-studies/marketecho/knowledge-base.png" alt="Knowledge base screen" />
</figure>

<p style="text-align:center; font-family: var(--font-mono); font-size:11.5px; color: var(--text-muted); letter-spacing:0.04em;">Subscription, referrals and the knowledge base — built from the same system as the core product.</p>

# The marketing site

Finally, the front door. I designed a responsive landing page with a single goal — conversion — using clear hierarchy and bold typography to teach visitors what makes MarketEcho different before pushing them to sign up. It carries the same visual language as the product, so the promise on the site matches the thing you get.

<figure class="cs-wide">
  <img src="/case-studies/marketecho/landing.png" alt="MarketEcho marketing landing page" />
  <figcaption>The marketing site — "Track, trade, profit." — built for conversion on the product's own visual language.</figcaption>
</figure>

# Outcome

MarketEcho launched with **100+ active users on day one**, **20+ positive reviews** from testers, **3 affiliate partners secured**, and full, active dev support — the system held up in build, not just in Figma. The design system remains the foundation the team continues to build on.

## What I learned

Balancing data density with visual clarity was the hardest part of the project, and it reframed how I think about "simplicity." For power users, simplicity doesn't mean hiding data — hide what a trader needs and you've made the product useless. It means prioritizing ruthlessly through hierarchy, so the most important information is loudest and everything else stays available but quiet. That principle ran through every screen in the end.

<p style="margin-top:32px;"><a href="https://www.behance.net/gallery/241398813/MarketEcho-Web-App-UXUI" target="_blank" rel="noopener noreferrer">View the full MarketEcho project on Behance ↗</a></p>

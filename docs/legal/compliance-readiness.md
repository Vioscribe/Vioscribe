# Vioscribe Legal and Privacy Readiness

**Status:** Not legally cleared for launch. Working scope assumes Vioscribe is operated from the UK and offered to UK students; confirm this and assess every other country deliberately targeted. This is an engineering and information checklist, not legal advice or a compliance certification.
**Last reviewed:** 28 September 2026

Drafts for the public-facing pages are in this folder. Do not replace the live Privacy or Terms pages with those drafts until the blocking items below are resolved and the controller has approved their factual and legal statements.

## Known service footprint from the repository

- Account emails and authentication are managed through Supabase Auth; users may choose Google sign-in.
- The app stores profiles, generated display names and friend codes, notes, decks, cards, files, study reviews, timer sessions, streaks, friend requests, room membership, and study-room presence.
- Users can expose their generated name and study activity to friends, join rooms where participants see each other’s display names/presence, and create a shared-deck link viewable by anyone who has the link.
- Supabase is used for authentication, database, and real-time features. Netlify hosts the site. Google participates when Google sign-in is selected.
- The code uses authentication cookies. The optional `hasSeenIntro` local-storage marker has been removed; no analytics or advertising tracker was found in the app source reviewed.
- There is no self-service account deletion or export flow in the UI. The database schema uses cascading account relationships for many records, but the operator must verify the actual production deletion procedure and provider backup/log retention.
- The app is designed for students; there is no date-of-birth collection or age gate. There is no free-text chat. User content can be shared by link.

## Blocking work before describing the service as compliant or publishing final legal pages

1. **Controller and provider disclosure**
   - Identify the operator by the legal name required for the chosen operating form.
   - Resolve the public geographic address requirement without publishing a private home address. The owner chose to leave this as a launch blocker for now. A suitable service/business address may be an option, but confirm it is valid for the operator and service; do not use an invented address or assume a PO box is enough.
   - Verify that `NEXT_PUBLIC_CONTACT_EMAIL` resolves to an actively monitored mailbox. The GitHub noreply address specified in the project brief is currently the code fallback, but it has not been verified as an inbox for privacy requests. Update the Netlify environment value too if it overrides the fallback.
   - Decide whether the operator must appoint or name a UK/EU representative or Data Protection Officer, based on the actual organisation and processing.

2. **Confirm scope and lawful bases**
   - Confirm whether launch is UK-only, includes the EEA, or targets other regions; add country-specific consumer, privacy, child-protection, and online-safety requirements as needed.
   - Confirm a lawful basis for each purpose and data category. The Privacy Policy draft proposes contract necessity for requested features, legitimate interests for proportionate service security, and legal obligation only where one applies. Document the basis and a legitimate-interests assessment where applicable; consider children’s capacity and best interests.
   - Confirm no special-category information is requested or intentionally used, and set a process for handling sensitive content users may put into free-text study materials.

3. **Children’s privacy and age-appropriate design**
   - Complete and retain a child-focused DPIA before launch, including the ICO Children’s Code standards, age-appropriate transparency, best interests, default settings, minimisation, sharing, retention, nudge techniques, and child consultation where appropriate.
   - Decide whether age assurance or age-appropriate experiences are needed. Do not add a simple age checkbox and treat it as proof that children cannot access the service.
   - Review friend discovery, room presence, shared-deck links, privacy defaults, and account removal for risks to under-18 users. The existing brief separately defers report/block and age-confirmation features; keep them as open product/safety work until specifically scoped and completed.

4. **Online Safety Act assessment**
   - Obtain a documented view on whether any part of Vioscribe is a regulated user-to-user service and has UK links. User-created deck content can be shared and encountered by other people, so do not assume the service is out of scope.
   - If in scope, complete the Ofcom children’s access assessment; if children are likely to access the service, complete the required children’s risk assessment and implement proportionate safety, reporting, complaints, and record-keeping measures that apply. Record the assessment and reassess on material service changes.

5. **Providers, location, transfers, and retention**
   - Record the Supabase project region, Netlify processing locations/logging, Google sign-in data flows, each provider’s role, relevant processor terms/DPAs, subprocessors, and retention periods.
   - Determine whether UK-restricted transfers occur and document the applicable adequacy decision or transfer safeguard and any required transfer risk assessment. Put accurate details in the public notice.
   - Set concrete retention criteria for account data, support requests, abuse/security records, provider logs, and backups. Confirm how a verified access, correction, export, or erasure request is actually fulfilled, including account deletion and removal of shared links.
   - Establish a process for handling rights requests and personal-data incidents, including assessment and regulator/individual notification where required.

6. **Cookies and device storage**
   - Before each release, inspect production responses and browser storage for cookies, web storage, analytics, pixels, embeds, and third-party tags. Only state “essential cookies only” if the live system confirms that; add valid consent controls before introducing non-essential storage/access technologies.

## Official guidance to use for the review

- ICO, [Privacy information to provide](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/the-right-to-be-informed/what-privacy-information-should-we-provide/).
- ICO, [Children’s Code introduction](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/introduction-to-the-childrens-code/) and [DPIA standard](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/2-data-protection-impact-assessments/).
- ICO, [Storage and access technologies guidance](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/).
- Ofcom, [Children’s access assessment duties](https://www.ofcom.org.uk/online-safety/illegal-and-harmful-content/childrens-access-assessment-duties-under-the-online-safety-act) and [protection of children duties](https://www.ofcom.org.uk/online-safety/protecting-children/protection-of-children-duties-under-the-online-safety-act).
- UK legislation, [Electronic Commerce Regulations 2002, regulation 6](https://www.legislation.gov.uk/uksi/2002/2013/regulation/6/made).

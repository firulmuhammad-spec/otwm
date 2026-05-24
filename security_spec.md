# Security Specification - CatatLembur Firestore Database

This document details the Zero-Trust Security Specification for the companion Firebase database of the **CatatLembur** application.

---

## 1. Data Invariants

- **User Isolation**: A user can only access (`read`, `write`, `delete`) their own settings and overtime logs. The prefix path variable `{userId}` must exactly match the authenticated user's `request.auth.uid`.
- **Validation Strictness**: Any configuration or log block must conform to explicit schemas, key constraints, and size-bounds to prevent Denial of Wallet and ID poisoning attacks.
- **Timestamp / Integrity Validation**: Field names and types are restricted cleanly. Strings have explicit size bounds (e.g., activity character size is capped to prevent bloated storage abuse).

---

## 2. The "Dirty Dozen" Payloads

Here are 12 specific payloads intended to breach security rules, and how the rules block them:

1. **Self-Elevated Settings Modification**: Attempt to create database records for a userId other than one's own.
   - *Blocked by*: `if isOwner(userId)` (forcing `userId == request.auth.uid`).
2. **Settings Inject-Extra-Fields Attack**: Attempt to save config settings containing unrecognized shadow fields.
   - *Blocked by*: `settings.keys().size() == 5` schema size test.
3. **Invalid Overtime Multiplier Mode**: Saving `overtimeType` as "unlimited_bonus_multiplier" instead of allowed values.
   - *Blocked by*: `(settings.overtimeType == 'hidup' || settings.overtimeType == 'mati')`.
4. **Log Storage Exhaustion (10MB Activity description)**: Sending massive size strings in the `activity` payload.
   - *Blocked by*: `log.activity.size() <= 5000` rule limit.
5. **ID Poisoning / Path injection**: Attempting to insert logs with complex special symbols or massive lengths as `logId`.
   - *Blocked by*: `isValidId(logId)` check.
6. **Orphaned User Configuration Update**: Modifying configs inside settings without being authenticated.
   - *Blocked by*: `isOwner(userId)` which fails on null authorization.
7. **Negative Rates Exploitation**: Setting `hourlyRate` to `-150000000`.
   - *Blocked by*: `settings.hourlyRate >= 0`.
8. **Invalid Types Injection**: Attempting to upload `durationHours` as a boolean (`true`) instead of a number.
   - *Blocked by*: `log.durationHours is number`.
9. **Log Date Spoofing Hack**: Log date formatted with excess garbage properties.
   - *Blocked by*: `log.date.size() == 10` length limit.
10. **Logs Reading Scraper**: Scrape collections without sending a authenticated query.
    - *Blocked by*: `allow list: if isOwner(userId)` filtering.
11. **Malicious Delete**: User A attempting to delete overtime logs belonging to User B.
    - *Blocked by*: Path containment logic and `isOwner(userId)` checking.
12. **Settings Configuration Type Mismatch**: Attempting to write `employeeName` as a numerical array.
    - *Blocked by*: `settings.employeeName is string`.

---

## 3. Firestore Rules Structure

The complete set of rules is written to `/firestore.rules`.
All inputs are validated via helper functions testing schema shape and authentications before any read/write permission is granted.

# Changelog

## 0.3.2

- Fix linking new numbers (and re-linking logged-out ones): WhatsApp now serves a separate
  login page that previously failed with "Cannot read properties of null (reading 'Socket')".
  The QR code and pairing code are shown from that page again.
- Fix photo, video and document sends that WhatsApp rejected while the API and console reported
  them as sent. Real send failures are now returned as errors.
- Console: send several attachments at once. Paste more images into an open preview, pick
  multiple files, give each file its own caption, and remove files before sending.
- Console: paste videos and documents copied in the file manager (previously only images), and
  drag files onto a chat or into the open preview to send them.
- Console: the message box returns to one line after sending, and the chat scrolls to the
  message just sent.
- Update notices: the console shows when a newer release is available, with its release notes
  (daily check of the public release list; nothing about the install is sent;
  `DISABLE_UPDATE_CHECK=true` turns it off). New `GET /v1/updates` and `POST /v1/updates/check`.
- One-click updates on servers set up with `install.sh`: Settings ▸ Updates installs the newest
  release, backing up the database and linked-number logins first and rolling back automatically
  if the new version does not start (`POST /v1/updates/install`). Existing installs enable it by
  running `install.sh` again.

## 0.3.1

- Move public guides, installer and plugin source to the-build-guild/rimberio.
- Update API reference links and n8n package repository metadata (0.1.12).

## 0.3.0

- Fast conversation summaries, cached recent messages and cursor-based older history.
- Live message deletion reconciliation and filtering of contact-only notification shells.
- Browser-compatible video conversion, video posters and real voice-note waveforms.
- Responsive operator UI, media viewer and improved settings navigation.
- Persisted API documentation switch and revised Swagger reference.
- Automated VPS installation with HTTPS and cloud-init templates.
- n8n 0.1.11: conversation pagination, history cursors and full media downloads.



Image tags follow the version numbers below. The compose file pins an exact tag on purpose —
upgrading is a deliberate one-line edit, not something that happens on the next `pull`.

## 0.1.0

First public release.

**Core**
- Link one or more WhatsApp numbers by QR code or pairing code
- REST API — 103 endpoints, Swagger UI at `/api-docs` when enabled
- Operator console modelled on WhatsApp Web: chats, calls, contacts, groups
- Webhooks and server-sent events for `message`, `message_sent`, `status`, `call`

**Messaging** — text, media, location, polls, stickers; reply, react, edit, delete, star,
forward, pin; message search and media download.

**Chats and contacts** — history, archive/pin/mute/mark-read, pinned messages, contact detail
with about text and groups in common, block/unblock, WhatsApp Business labels.

**Groups** — create, participants, admins, invite links, subject and description.

**Safety**
- Per-session rate limiting: burst cap, daily cap, randomised spacing between sends
- Deferred sends are queued and answered `202`, not dropped
- Ban-risk warnings in the console
- Audit log of every mutating request
- `check-number` to confirm a number is on WhatsApp before messaging it

**Automation** — keyword and regex auto-reply rules with business hours and cooldowns;
one-click templates; an [n8n community node](examples/n8n.md) with a self-registering trigger.

**Platforms** — images published for linux/amd64, linux/arm64, and linux/arm/v7 (Raspberry Pi 4/5 on 64-bit OS, and 32-bit installs or older Pi 2/3, respectively).

**Operations** — watchdog with automatic recovery from crashed browsers, uptime and
message-volume history, Prometheus metrics, JSON logging, session backup/restore,
config export/import, scoped API keys.

### Known limitations

- **One webhook configuration per session.** Two consumers pointed at the same session will
  overwrite each other.
- **Reads are live.** Nothing is mirrored into the database, so large history reads are slow
  and cost a round trip into a real browser.
- **Roughly 1 GB of RAM per linked number.** Each one is a real Chromium process.

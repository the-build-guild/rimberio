# API reference

Rimberio 0.3.1: 141 operations. [OpenAPI JSON](openapi.json). Your instance provides the interactive reference at /api-docs when enabled.

Authenticate using either `Authorization: Bearer TOKEN` or `X-Bridge-Token: TOKEN`. Prefer scoped API keys. Public health and account-auth routes have their own policies. WhatsApp routes may require license activation.

Chat lists use `limit` and `offset`. For history, request `mode=recent`, then `mode=older&before=NEXT_CURSOR` using the previous response's `nextCursor`. Media returns JSON containing `mimetype`, `base64` and `filename`; use `full=1` for full files and `browser=1` for browser-compatible video.

Send responses: 201 means sent; 202 means queued. Observe `message_sent` or inspect the queue to determine the result. Browser-only SSE events such as `message_deleted` are not added to the four supported webhook subscription types.

## API keys

| Method | Path | Description |
|---|---|---|
| GET | `/v1/api-keys` | List API keys |
| POST | `/v1/api-keys` | Create a scoped API key |
| DELETE | `/v1/api-keys/{keyId}` | Revoke an API key |

## Audit log

| Method | Path | Description |
|---|---|---|
| GET | `/v1/audit-log` | Recent audit log entries |

## Auto-reply rules

| Method | Path | Description |
|---|---|---|
| GET | `/v1/whatsapp/sessions/{id}/rules` | List auto-reply rules |
| POST | `/v1/whatsapp/sessions/{id}/rules` | Create an auto-reply rule |
| PUT | `/v1/whatsapp/sessions/{id}/rules/{ruleId}` | Update an auto-reply rule |
| DELETE | `/v1/whatsapp/sessions/{id}/rules/{ruleId}` | Delete an auto-reply rule |
| POST | `/v1/whatsapp/sessions/{id}/rules/test` | Dry-run rule matching |

## Browser tuning

| Method | Path | Description |
|---|---|---|
| GET | `/v1/whatsapp/sessions/{id}/browser-config` | Effective Puppeteer/Chromium launch config |
| PUT | `/v1/whatsapp/sessions/{id}/browser-config` | Override this session's Puppeteer/Chromium launch config |

## Channels

| Method | Path | Description |
|---|---|---|
| GET | `/v1/whatsapp/sessions/{id}/channels` | List channels this account follows |
| GET | `/v1/whatsapp/sessions/{id}/channels/discover` | Browse WhatsApp's channel directory (recommended/trending/popular/new, or a text search) |
| GET | `/v1/whatsapp/sessions/{id}/channels/invite/{code}` | Look up a channel by its invite code (the part after whatsapp.com/channel/) |
| POST | `/v1/whatsapp/sessions/{id}/channels/{channelId}/subscribe` | Follow a channel |
| POST | `/v1/whatsapp/sessions/{id}/channels/{channelId}/unsubscribe` | Unfollow a channel |

## Cloud API

| Method | Path | Description |
|---|---|---|
| POST | `/v1/{phoneNumberId}/messages` | Send a Cloud API-shaped WhatsApp message |
| POST | `/v1/{phoneNumberId}/media` | Upload media for Cloud API-shaped sends |
| GET | `/v1/media/{mediaId}` |  |
| DELETE | `/v1/media/{mediaId}` |  |
| GET | `/v1/media/{mediaId}/download` |  |
| GET | `/v1/{wabaId}/phone_numbers` |  |
| POST | `/v1/{wabaId}/subscribed_apps` |  |
| GET | `/v1/{phoneNumberId}` |  |

## Config as code

| Method | Path | Description |
|---|---|---|
| GET | `/v1/config/export` | Export webhook/rate-limit/proxy/browser-config/rules for every configured session |
| POST | `/v1/config/import` | Apply a previously-exported config bundle |

## Customer data

| Method | Path | Description |
|---|---|---|
| GET | `/v1/whatsapp/sessions/{id}/customer-data/contacts/{chatId}/note` | Get the Rimberio-owned note for a chat |
| PUT | `/v1/whatsapp/sessions/{id}/customer-data/contacts/{chatId}/note` | Save or clear the Rimberio-owned note for a chat |
| GET | `/v1/whatsapp/sessions/{id}/lists` | List Rimberio-owned chat lists |
| POST | `/v1/whatsapp/sessions/{id}/lists` | Create a Rimberio-owned chat list |
| DELETE | `/v1/whatsapp/sessions/{id}/lists/{listId}` | Delete a Rimberio-owned chat list |
| GET | `/v1/whatsapp/sessions/{id}/lists/chat/{chatId}` | List all Rimberio lists and assignments for one chat |
| PUT | `/v1/whatsapp/sessions/{id}/lists/chat/{chatId}` | Replace a chat's Rimberio list assignments |

## Diagnostics

| Method | Path | Description |
|---|---|---|
| GET | `/v1/health` | Health check |
| GET | `/v1/docs` | Whether the Swagger UI (/api-docs) is currently served, and why |
| PUT | `/v1/docs` | Turn the Swagger UI on or off without a restart |
| GET | `/v1/watchdog/status` | Auto-restart status |
| GET | `/metrics` | Prometheus metrics |

## Event stream

| Method | Path | Description |
|---|---|---|
| GET | `/v1/events` | Live event stream (SSE) |

## Groups

| Method | Path | Description |
|---|---|---|
| POST | `/v1/whatsapp/sessions/{id}/groups` | Create a group |
| GET | `/v1/whatsapp/sessions/{id}/groups/{groupId}` | Get group info |
| POST | `/v1/whatsapp/sessions/{id}/groups/{groupId}/participants` | Add participants |
| DELETE | `/v1/whatsapp/sessions/{id}/groups/{groupId}/participants` | Remove participants |
| POST | `/v1/whatsapp/sessions/{id}/groups/{groupId}/admins` | Promote participants to admin |
| DELETE | `/v1/whatsapp/sessions/{id}/groups/{groupId}/admins` | Demote admins to regular participant |
| GET | `/v1/whatsapp/sessions/{id}/groups/{groupId}/invite-code` | Get invite code |
| POST | `/v1/whatsapp/sessions/{id}/groups/{groupId}/invite-code/revoke` | Revoke invite code |
| PUT | `/v1/whatsapp/sessions/{id}/groups/{groupId}/subject` | Set group subject (name) |
| PUT | `/v1/whatsapp/sessions/{id}/groups/{groupId}/description` | Set group description |
| POST | `/v1/whatsapp/sessions/{id}/groups/{groupId}/leave` | Leave a group |

## Logs

| Method | Path | Description |
|---|---|---|
| GET | `/v1/logs` | Recent operational log entries |

## Messages

| Method | Path | Description |
|---|---|---|
| POST | `/v1/whatsapp/sessions/{id}/messages/text` | Send a text message |
| POST | `/v1/whatsapp/sessions/{id}/messages/media` | Send a media message |
| POST | `/v1/whatsapp/sessions/{id}/messages/location` | Send a location message |
| POST | `/v1/whatsapp/sessions/{id}/messages/poll` | Send a poll |
| POST | `/v1/whatsapp/sessions/{id}/messages/contacts` | Send one or more WhatsApp contacts |
| POST | `/v1/whatsapp/sessions/{id}/messages/call-link` | Generate a call link and send it |
| POST | `/v1/whatsapp/sessions/{id}/messages/sticker` | Send a sticker |
| GET | `/v1/whatsapp/sessions/{id}/messages/search` | Search messages |
| GET | `/v1/whatsapp/sessions/{id}/messages/{messageId}/media` | Download a message's attached media |
| POST | `/v1/whatsapp/sessions/{id}/messages/{messageId}/react` | React to a message |
| POST | `/v1/whatsapp/sessions/{id}/messages/{messageId}/reply` | Reply to (quote) a message |
| POST | `/v1/whatsapp/sessions/{id}/messages/{messageId}/star` | Star a message |
| POST | `/v1/whatsapp/sessions/{id}/messages/{messageId}/unstar` | Unstar a message |
| POST | `/v1/whatsapp/sessions/{id}/messages/{messageId}/forward` | Forward a message to another chat |
| POST | `/v1/whatsapp/sessions/{id}/messages/{messageId}/pin` | Pin a message in its chat |
| POST | `/v1/whatsapp/sessions/{id}/messages/{messageId}/unpin` | Unpin a message |
| PUT | `/v1/whatsapp/sessions/{id}/messages/{messageId}` | Edit a sent message |
| DELETE | `/v1/whatsapp/sessions/{id}/messages/{messageId}` | Delete a message |
| GET | `/v1/whatsapp/sessions/{id}/chats` | List chats |
| GET | `/v1/whatsapp/sessions/{id}/chats/{chatId}/pinned-messages` | List pinned messages in a chat |
| GET | `/v1/whatsapp/sessions/{id}/chats/{chatId}/profile-pic` | Get a chat's profile picture URL |
| GET | `/v1/whatsapp/sessions/{id}/chats/{chatId}/messages` | Fetch chat message history |
| POST | `/v1/whatsapp/sessions/{id}/chats/{chatId}/seen` | Mark chat as read |
| GET | `/v1/whatsapp/sessions/{id}/chats/{chatId}/presence` | Get live chat presence |
| POST | `/v1/whatsapp/sessions/{id}/chats/{chatId}/typing` | Show typing indicator |
| POST | `/v1/whatsapp/sessions/{id}/chats/{chatId}/recording` | Show recording-audio indicator |
| POST | `/v1/whatsapp/sessions/{id}/chats/{chatId}/clear-state` | Clear typing/recording indicator |
| POST | `/v1/whatsapp/sessions/{id}/chats/{chatId}/archive` | Archive a chat |
| POST | `/v1/whatsapp/sessions/{id}/chats/{chatId}/unarchive` | Unarchive a chat |
| POST | `/v1/whatsapp/sessions/{id}/chats/{chatId}/pin` | Pin a chat |
| POST | `/v1/whatsapp/sessions/{id}/chats/{chatId}/unpin` | Unpin a chat |
| POST | `/v1/whatsapp/sessions/{id}/chats/{chatId}/mute` | Mute a chat |
| POST | `/v1/whatsapp/sessions/{id}/chats/{chatId}/unmute` | Unmute a chat |
| POST | `/v1/whatsapp/sessions/{id}/chats/{chatId}/mark-unread` | Mark a chat as unread |
| POST | `/v1/whatsapp/sessions/{id}/chats/{chatId}/clear` | Clear a chat's message history |
| DELETE | `/v1/whatsapp/sessions/{id}/chats/{chatId}` | Delete a chat |
| GET | `/v1/whatsapp/sessions/{id}/contacts` | List contacts |
| GET | `/v1/whatsapp/sessions/{id}/contacts/registered/{number}` | Check whether a phone number is registered on WhatsApp |
| GET | `/v1/whatsapp/sessions/{id}/contacts/{contactId}` | Get one contact's details |
| GET | `/v1/whatsapp/sessions/{id}/contacts/{contactId}/profile-pic` | Get profile picture URL |
| POST | `/v1/whatsapp/sessions/{id}/contacts/{contactId}/block` | Block a contact |
| POST | `/v1/whatsapp/sessions/{id}/contacts/{contactId}/unblock` | Unblock a contact |
| GET | `/v1/whatsapp/sessions/{id}/status` | List contacts (including this account) with an active status/story |
| GET | `/v1/whatsapp/sessions/{id}/status/{contactId}` | One contact's current status updates |
| GET | `/v1/whatsapp/sessions/{id}/status/{contactId}/{messageId}/media` | Download a status update's attached media |
| DELETE | `/v1/whatsapp/sessions/{id}/status/{messageId}` | Delete one of this account's own posted statuses |
| POST | `/v1/whatsapp/sessions/{id}/status/text` | Post a text status/story |
| POST | `/v1/whatsapp/sessions/{id}/status/media` | Post an image/video status/story |
| GET | `/v1/whatsapp/sessions/{id}/calls` | List recent calls |
| GET | `/v1/whatsapp/sessions/{id}/calls/debug` | Inspect the WhatsApp Web call watcher |
| POST | `/v1/whatsapp/sessions/{id}/calls/{callId}/reject` | Reject an incoming call |
| GET | `/v1/whatsapp/sessions/{id}/labels` | List labels |
| GET | `/v1/whatsapp/sessions/{id}/labels/chat/{chatId}` | List a chat's labels |
| POST | `/v1/whatsapp/sessions/{id}/labels/chat/{chatId}` | Add or remove labels on a chat |

## Proxy

| Method | Path | Description |
|---|---|---|
| GET | `/v1/whatsapp/sessions/{id}/proxy` | Get proxy config |
| PUT | `/v1/whatsapp/sessions/{id}/proxy` | Set this session's proxy |
| DELETE | `/v1/whatsapp/sessions/{id}/proxy` | Remove this session's proxy |

## Quick replies

| Method | Path | Description |
|---|---|---|
| GET | `/v1/whatsapp/sessions/{id}/quick-replies` | List this session's quick replies |
| POST | `/v1/whatsapp/sessions/{id}/quick-replies` | Create a quick reply |
| PUT | `/v1/whatsapp/sessions/{id}/quick-replies/{replyId}` | Update a quick reply's shortcut and/or message |
| DELETE | `/v1/whatsapp/sessions/{id}/quick-replies/{replyId}` | Delete a quick reply |

## Rate limiting

| Method | Path | Description |
|---|---|---|
| GET | `/v1/whatsapp/sessions/{id}/rate-limit` | Rate-limit config and usage |
| PUT | `/v1/whatsapp/sessions/{id}/rate-limit` | Override this session's rate limits |
| GET | `/v1/whatsapp/sessions/{id}/rate-limit/queue` | Queue status: pending sends, recent history, and backoff state |
| DELETE | `/v1/whatsapp/sessions/{id}/rate-limit/queue/{queueId}` | Cancel a pending queued send |
| POST | `/v1/whatsapp/sessions/{id}/rate-limit/queue/{queueId}/retry` | Retry a failed queued send |

## Webhooks

| Method | Path | Description |
|---|---|---|
| GET | `/v1/whatsapp/sessions/{id}/webhook` | Get webhook config |
| PUT | `/v1/whatsapp/sessions/{id}/webhook` | Create or update webhook config |
| DELETE | `/v1/whatsapp/sessions/{id}/webhook` | Remove webhook config |
| GET | `/v1/whatsapp/sessions/{id}/webhook/deliveries` | Recent delivery attempts |
| POST | `/v1/whatsapp/sessions/{id}/webhook/deliveries/{deliveryId}/replay` | Replay a delivery |
| GET | `/v1/whatsapp/sessions/{id}/webhooks` | List webhook subscriptions |
| PUT | `/v1/whatsapp/sessions/{id}/webhooks` | Create or update a webhook subscription |
| DELETE | `/v1/whatsapp/sessions/{id}/webhooks` | Remove one webhook subscription |

## WhatsApp Auth

| Method | Path | Description |
|---|---|---|
| GET | `/v1/whatsapp/sessions` | List WhatsApp sessions |
| POST | `/v1/whatsapp/sessions/{id}/start` | Start (or resume) a WhatsApp session |
| GET | `/v1/whatsapp/sessions/{id}` | Session status |
| DELETE | `/v1/whatsapp/sessions/{id}` | Unlink a WhatsApp session |
| GET | `/v1/whatsapp/sessions/{id}/history/uptime` | Session connection-status history |
| GET | `/v1/whatsapp/sessions/{id}/history/messages` | Session daily message-volume history |
| POST | `/v1/whatsapp/sessions/{id}/restart` | Restart a session's browser |
| POST | `/v1/whatsapp/sessions/{id}/rename` | Migrate a legacy session id to its phone number |
| PUT | `/v1/whatsapp/sessions/{id}/friendly-name` | Set the operator-facing friendly name for a WhatsApp session |
| GET | `/v1/whatsapp/sessions/{id}/backup` | Download a session's local backup |
| POST | `/v1/whatsapp/sessions/{id}/restore` | Restore a session from a backup |
| POST | `/v1/whatsapp/sessions/{id}/presence/available` | Set presence to online |
| POST | `/v1/whatsapp/sessions/{id}/presence/unavailable` | Set presence to offline |
| PUT | `/v1/whatsapp/sessions/{id}/profile` | Update this account's display name/status |
| PUT | `/v1/whatsapp/sessions/{id}/profile-picture` | Set this account's profile picture |
| GET | `/v1/whatsapp/sessions/{id}/check-number/{number}` | Check whether a number is on WhatsApp |

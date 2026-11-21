# @thebuildguild/n8n-nodes-rimberio

An n8n community node for Rimberio: send, receive, and automate WhatsApp workflows through your own self-hosted instance.

## Installation

From the n8n editor on self-hosted n8n: Settings -> Community nodes -> Install, then enter:

```bash
@thebuildguild/n8n-nodes-rimberio
```

Manual install:

```bash
npm install @thebuildguild/n8n-nodes-rimberio
```

## Credentials

Create a Rimberio API credential with:

- Base URL: where your instance is reachable, for example `https://rimberio.example.com`
- Token: your `BRIDGE_TOKEN`, or preferably a scoped API key from Settings -> API keys

Action-only workflows usually work with a `send` scoped key. Rimberio Trigger workflows need an admin-capable key because activation registers a webhook subscription.

Use Test to confirm connectivity. It calls `/v1/health`, which still requires auth but skips the licence check.

## Nodes

### Rimberio

Automation-focused actions:

| Resource | Operations |
|---|---|
| Message | Send Text, Send Media, Send Location, Send Poll, Send Contacts, Send Call Link, Send Sticker, Reply, React, Forward, Edit, Delete, Star, Unstar, Pin, Unpin, Download Media, Search |
| Chat | List, Get Messages, Get Pinned Messages, Get Profile Picture, Get Presence, Mark as Read, Mark as Unread, Typing, Recording, Clear State, Archive, Unarchive, Pin, Unpin, Mute, Unmute, Clear |
| Contact | List, Check Number, Get, Get Profile Picture, Block, Unblock |
| Group | Create, Get, Add Participants, Remove Participants, Promote Admins, Demote Admins, Get Invite Code, Revoke Invite Code, Set Subject, Set Description, Leave |
| Label | List, Get Chat Labels, Set Chat Labels |
| Queue | Get Usage, Get Queue, Cancel Queued Send, Retry Failed Send |
| Session | List, Get, Set Available, Set Unavailable |

Admin surfaces such as API key management, audit log, config import/export, browser tuning, proxy tuning, and webhook management are intentionally left to the Rimberio console or HTTP Request node.

### Rimberio Trigger

Fires on activity from your instance. It registers one webhook subscription when the workflow is activated and removes that subscription on deactivation.

| Event | Fires when |
|---|---|
| Message Received | An inbound message arrives |
| Message Sent | A rate-limit-queued outbound send completes |
| Session Status | A session connects, disconnects, or fails to authenticate |
| Call Received | An incoming call arrives |

Multiple trigger nodes can subscribe to the same WhatsApp session. Rimberio stores webhook subscriptions independently by URL, so one workflow no longer replaces another.

## Queued Sends

Rimberio rate-limits outbound messages. When a send is deferred, the API returns `202` with `queued: true` and a `queueId`; the node treats that as success and exposes `queued: true`.

Do not retry a queued send. The final result arrives later as a Message Sent trigger event carrying the same `queueId`, or through Queue -> Get Queue.

## Compatibility

Requires n8n 1.x and Node 20.15+. Tested against Rimberio 0.1.x.

## Documentation and support

- Rimberio documentation: https://github.com/buildtheguild/rimberio
- API reference: https://github.com/buildtheguild/rimberio/blob/main/docs/api.md
- Report an issue: https://github.com/buildtheguild/rimberio/issues

## License

MIT

## Version 0.1.11

Chat List supports limit/offset pagination. Get Messages returns the newest page first; pass the returned `nextCursor` in Before Cursor to load earlier messages. Download Media requests the full attachment and can optionally convert video to browser-compatible MP4. The default preserves the original format. Requires Rimberio 0.3.0 for cursor pagination and conversion.

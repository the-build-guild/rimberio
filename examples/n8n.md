# n8n

Rimberio ships a first-class n8n community node, so common WhatsApp automations do not need to be assembled from raw HTTP Request nodes.

## Install

Settings -> Community nodes -> Install, then enter:

```text
@thebuildguild/n8n-nodes-rimberio
```

Self-hosted n8n only; n8n Cloud does not allow community nodes.

## Credential

Create a Rimberio API credential:

| Field | Value |
|---|---|
| Base URL | `https://rimberio.example.com`, where your instance is reachable, no trailing slash |
| Token | Your `BRIDGE_TOKEN`, or better, a scoped API key |

Prefer an API key. Create one in the console under Settings -> API keys so it can be revoked independently and attributed in the audit log.

Action-only workflows usually work with a `send` scoped key. Rimberio Trigger workflows need an admin-capable key because activation registers a webhook subscription.

## Nodes

### Rimberio

| Resource | Operations |
|---|---|
| Message | Send Text, Send Media, Send Location, Send Poll, Send Contacts, Send Call Link, Send Sticker, Reply, React, Forward, Edit, Delete, Star, Unstar, Pin, Unpin, Download Media, Search |
| Chat | List, Get Messages, Get Pinned Messages, Get Profile Picture, Get Presence, Mark as Read, Mark as Unread, Typing, Recording, Clear State, Archive, Unarchive, Pin, Unpin, Mute, Unmute, Clear |
| Contact | List, Check Number, Get, Get Profile Picture, Block, Unblock |
| Group | Create, Get, Add Participants, Remove Participants, Promote Admins, Demote Admins, Get Invite Code, Revoke Invite Code, Set Subject, Set Description, Leave |
| Label | List, Get Chat Labels, Set Chat Labels |
| Queue | Get Usage, Get Queue, Cancel Queued Send, Retry Failed Send |
| Session | List, Get, Set Available, Set Unavailable |

Admin surfaces remain available through the Rimberio console or a plain HTTP Request node.

### Rimberio Trigger

Registers its own webhook subscription with Rimberio when the workflow is activated and removes that subscription on deactivation.

| Event | Fires when |
|---|---|
| Message Received | An inbound message arrives |
| Message Sent | A queued outbound send finishes |
| Session Status | A session connects, disconnects, or fails to authenticate |
| Call Received | An incoming call arrives |

Multiple n8n triggers can subscribe to the same WhatsApp session because Rimberio stores webhook subscriptions independently by URL.

## Queued Sends

Rimberio rate-limits outbound messages to reduce ban risk. When a send is deferred, the API answers `202` with `queued: true` instead of a message id, and the node sets `queued: true` on its output item.

That is success. Do not retry it. The final outcome arrives later as a Message Sent trigger event carrying the matching `queueId`, or through Queue -> Get Queue.

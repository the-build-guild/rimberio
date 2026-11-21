import type {
  IDataObject,
  IExecuteFunctions,
  IHttpRequestMethods,
  ILoadOptionsFunctions,
  INodeExecutionData,
  INodePropertyOptions,
  INodeType,
  INodeTypeDescription,
  IRequestOptions
} from "n8n-workflow";
import { NodeOperationError, UnexpectedError } from "n8n-workflow";

function csv(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return String(value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function jsonObject(value: unknown): IDataObject | undefined {
  const text = String(value || "").trim();
  if (!text) return undefined;
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new UnexpectedError("Expected a JSON object");
  return parsed as IDataObject;
}

function hasEnabledNativeCallRejectRule(payload: any): boolean {
  const rules = Array.isArray(payload?.rules) ? payload.rules : Array.isArray(payload) ? payload : [];
  return rules.some((rule: any) => !!rule?.enabled && !!rule?.rejectCall && (rule?.type === "call" || rule?.type === "business_hours"));
}

const MESSAGE_OPERATIONS = [
  { name: "Delete", value: "delete", action: "Delete a message" },
  { name: "Download Media", value: "downloadMedia", action: "Download message media" },
  { name: "Edit", value: "edit", action: "Edit a sent message" },
  { name: "Forward", value: "forward", action: "Forward a message" },
  { name: "Pin", value: "pinMessage", action: "Pin a message" },
  { name: "React", value: "react", action: "React to a message" },
  { name: "Reply", value: "reply", action: "Reply to a message" },
  { name: "Search", value: "search", action: "Search messages" },
  { name: "Send Call Link", value: "sendCallLink", action: "Send a call link" },
  { name: "Send Contacts", value: "sendContacts", action: "Send contact cards" },
  { name: "Send Location", value: "sendLocation", action: "Send a location" },
  { name: "Send Media", value: "sendMedia", action: "Send media" },
  { name: "Send Poll", value: "sendPoll", action: "Send a poll" },
  { name: "Send Sticker", value: "sendSticker", action: "Send a sticker" },
  { name: "Send Text", value: "sendText", action: "Send a text message" },
  { name: "Star", value: "star", action: "Star a message" },
  { name: "Unpin", value: "unpinMessage", action: "Unpin a message" },
  { name: "Unstar", value: "unstar", action: "Unstar a message" }
];

const CHAT_OPERATIONS = [
  { name: "Archive", value: "archive", action: "Archive a chat" },
  { name: "Clear", value: "clear", action: "Clear a chat" },
  { name: "Clear State", value: "clearState", action: "Clear typing or recording state" },
  { name: "Get Messages", value: "messages", action: "Get chat history" },
  { name: "Get Pinned Messages", value: "pinnedMessages", action: "Get pinned messages" },
  { name: "Get Presence", value: "presence", action: "Get chat presence" },
  { name: "Get Profile Picture", value: "profilePic", action: "Get chat profile picture" },
  { name: "List", value: "list", action: "List chats" },
  { name: "Mark as Read", value: "markRead", action: "Mark a chat as read" },
  { name: "Mark as Unread", value: "markUnread", action: "Mark a chat as unread" },
  { name: "Mute", value: "mute", action: "Mute a chat" },
  { name: "Pin", value: "pin", action: "Pin a chat" },
  { name: "Recording", value: "recording", action: "Show recording indicator" },
  { name: "Typing", value: "typing", action: "Show typing indicator" },
  { name: "Unarchive", value: "unarchive", action: "Unarchive a chat" },
  { name: "Unmute", value: "unmute", action: "Unmute a chat" },
  { name: "Unpin", value: "unpin", action: "Unpin a chat" }
];

const CALL_OPERATIONS = [
  { name: "List Recent Calls", value: "list", action: "List recent WhatsApp calls" },
  { name: "Reject Incoming Call", value: "reject", action: "Reject an incoming WhatsApp call" }
];

const RULE_OPERATIONS = [
  { name: "Create", value: "create", action: "Create an auto reply rule" },
  { name: "Delete", value: "delete", action: "Delete an auto reply rule" },
  { name: "List", value: "list", action: "List auto reply rules" },
  { name: "Test", value: "test", action: "Test auto reply rule matching" },
  { name: "Update", value: "update", action: "Update an auto reply rule" }
];

const STATUS_OPERATIONS = [
  { name: "Post Text Status", value: "text", action: "Post a WhatsApp text status" },
  { name: "Post Media Status", value: "media", action: "Post a WhatsApp image or video status" }
];

export class Rimberio implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Rimberio",
    name: "rimberio",
    icon: "file:rimberio.svg",
    group: ["output"],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: "Automate WhatsApp messaging through a self-hosted Rimberio instance",
    defaults: { name: "Rimberio" },
    inputs: ["main"] as any,
    outputs: ["main"] as any,
    credentials: [{ name: "wapiBridgeApi", required: true }],
    requestDefaults: {
      baseURL: "={{$credentials.baseUrl}}",
      headers: { "Content-Type": "application/json" }
    },
    properties: [
      { displayName: "WhatsApp Number Name or ID", name: "sessionId", type: "options", typeOptions: { loadOptionsMethod: "getSessions" }, default: "", required: true, description: "Choose from the list, or specify an ID using an <a href=\"https://docs.n8n.io/code/expressions/\">expression</a>", displayOptions: { hide: { resource: ["session"] } } },
      {
        displayName: "Resource",
        name: "resource",
        type: "options",
        noDataExpression: true,
        options: [
          { name: "Call", value: "call" },
          { name: "Chat", value: "chat" },
          { name: "Contact", value: "contact" },
          { name: "Group", value: "group" },
          { name: "Label", value: "label" },
          { name: "Message", value: "message" },
          { name: "Queue", value: "queue" },
          { name: "Rule", value: "rule" },
          { name: "Session", value: "session" },
          { name: "Status", value: "status" }
        ],
        default: "message"
      },
      { displayName: "Operation", name: "operation", type: "options", noDataExpression: true, displayOptions: { show: { resource: ["message"] } }, options: MESSAGE_OPERATIONS, default: "sendText" },
      { displayName: "Operation", name: "operation", type: "options", noDataExpression: true, displayOptions: { show: { resource: ["chat"] } }, options: CHAT_OPERATIONS, default: "list" },
      {
        displayName: "Operation",
        name: "operation",
        type: "options",
        noDataExpression: true,
        displayOptions: { show: { resource: ["contact"] } },
        options: [
          { name: "Block", value: "block", action: "Block a contact" },
          { name: "Check Number", value: "check", action: 'Check whether a number is on whats app' },
          { name: "Get", value: "get", action: "Get contact details" },
          { name: "Get Profile Picture", value: "profilePic", action: "Get contact profile picture" },
          { name: "List", value: "list", action: "List contacts" },
          { name: "Unblock", value: "unblock", action: "Unblock a contact" }
        ],
        default: "check"
      },
      {
        displayName: "Operation",
        name: "operation",
        type: "options",
        noDataExpression: true,
        displayOptions: { show: { resource: ["group"] } },
        options: [
          { name: "Add Participants", value: "addParticipants", action: "Add group participants" },
          { name: "Create", value: "create", action: "Create a group" },
          { name: "Demote Admins", value: "demote", action: "Demote admins" },
          { name: "Get", value: "get", action: "Get group info" },
          { name: "Get Invite Code", value: "inviteCode", action: "Get group invite code" },
          { name: "Leave", value: "leave", action: "Leave a group" },
          { name: "Promote Admins", value: "promote", action: "Promote admins" },
          { name: "Remove Participants", value: "removeParticipants", action: "Remove group participants" },
          { name: "Revoke Invite Code", value: "revokeInvite", action: "Revoke group invite code" },
          { name: "Set Description", value: "setDescription", action: "Set group description" },
          { name: "Set Subject", value: "setSubject", action: "Set group subject" }
        ],
        default: "get"
      },
      {
        displayName: "Operation",
        name: "operation",
        type: "options",
        noDataExpression: true,
        displayOptions: { show: { resource: ["label"] } },
        options: [
          { name: "Get Chat Labels", value: "getChatLabels", action: "Get labels for a chat" },
          { name: "List", value: "list", action: "List labels" },
          { name: "Set Chat Labels", value: "setChatLabels", action: "Set labels for a chat" }
        ],
        default: "list"
      },
      {
        displayName: "Operation",
        name: "operation",
        type: "options",
        noDataExpression: true,
        displayOptions: { show: { resource: ["queue"] } },
        options: [
          { name: "Cancel Queued Send", value: "cancel", action: "Cancel a queued send" },
          { name: "Get Queue", value: "queue", action: "Get queue status" },
          { name: "Get Usage", value: "usage", action: 'Get rate limit usage' },
          { name: "Retry Failed Send", value: "retry", action: "Retry a failed queued send" }
        ],
        default: "queue"
      },
      {
        displayName: "Operation",
        name: "operation",
        type: "options",
        noDataExpression: true,
        displayOptions: { show: { resource: ["session"] } },
        options: [
          { name: "Get", value: "get", action: "Get session status" },
          { name: "List", value: "list", action: "List sessions" },
          { name: "Set Available", value: "available", action: "Set presence available" },
          { name: "Set Unavailable", value: "unavailable", action: "Set presence unavailable" }
        ],
        default: "list"
      },
      {
        displayName: "Operation",
        name: "operation",
        type: "options",
        noDataExpression: true,
        displayOptions: { show: { resource: ["call"] } },
        options: CALL_OPERATIONS,
        default: "list"
      },
      {
        displayName: "Operation",
        name: "operation",
        type: "options",
        noDataExpression: true,
        displayOptions: { show: { resource: ["rule"] } },
        options: RULE_OPERATIONS,
        default: "list"
      },
      {
        displayName: "Operation",
        name: "operation",
        type: "options",
        noDataExpression: true,
        displayOptions: { show: { resource: ["status"] } },
        options: STATUS_OPERATIONS,
        default: "text"
      },
      { displayName: "WhatsApp Number Name or ID", name: "sessionLookupId", type: "string", default: "", required: true, description: "The linked sender phone number / phone_number_id; in trigger data this is entry[0].changes[0].value.metadata.phone_number_id", displayOptions: { show: { resource: ["session"], operation: ["get", "available", "unavailable"] } } },
      { displayName: "Recipient Phone Number or Chat ID", name: "to", type: "string", default: "", required: true, placeholder: "15551234567", description: "For replies to a Rimberio trigger, use entry[0].changes[0].value.messages[0].from or entry[0].changes[0].value.contacts[0].wa_id. Group IDs ending in @g.us are also accepted.", displayOptions: { show: { resource: ["message"], operation: ["sendText", "sendMedia", "sendLocation", "sendPoll", "sendContacts", "sendCallLink", "sendSticker"] } } },
      { displayName: "Text", name: "text", type: "string", typeOptions: { rows: 3 }, default: "", required: true, displayOptions: { show: { resource: ["message"], operation: ["sendText", "reply", "edit"] } } },
      { displayName: "Media URL", name: "url", type: "string", default: "", required: true, description: "Fetched by the Rimberio server, so it must be reachable from there", displayOptions: { show: { resource: ["message"], operation: ["sendMedia", "sendSticker"] } } },
      { displayName: "Caption", name: "caption", type: "string", default: "", displayOptions: { show: { resource: ["message"], operation: ["sendMedia"] } } },
      { displayName: "Filename", name: "filename", type: "string", default: "", displayOptions: { show: { resource: ["message"], operation: ["sendMedia"] } } },
      { displayName: "Message ID", name: "messageId", type: "string", default: "", required: true, description: "For a Rimberio trigger, use the incoming message ID from the trigger payload", displayOptions: { show: { resource: ["message"], operation: ["reply", "react", "forward", "pinMessage", "unpinMessage", "star", "unstar", "edit", "delete", "downloadMedia"] } } },
      { displayName: "Reaction", name: "reaction", type: "string", default: "", description: "Send an empty value to remove an existing reaction", displayOptions: { show: { resource: ["message"], operation: ["react"] } } },
      { displayName: "Query", name: "query", type: "string", default: "", required: true, displayOptions: { show: { resource: ["message"], operation: ["search"] } } },
      { displayName: "Recipient Phone Number or Chat ID", name: "chatId", type: "string", default: "", required: true, placeholder: "15551234567", description: "For message-triggered workflows, use entry[0].changes[0].value.messages[0].from. This field also accepts group chat IDs ending in @g.us.", displayOptions: { show: { resource: ["chat"], operation: ["messages", "markRead", "markUnread", "pinnedMessages", "profilePic", "presence", "typing", "recording", "clearState", "archive", "unarchive", "pin", "unpin", "mute", "unmute", "clear"] } } },
      { displayName: "Duration Seconds", name: "stateDurationSeconds", type: "number", default: 0, description: "Optional. How long to keep typing or recording visible before clearing it. Leave 0 to let WhatsApp expire it automatically.", typeOptions: { minValue: 0, maxValue: 30 }, displayOptions: { show: { resource: ["chat"], operation: ["typing", "recording"] } } },
      { displayName: "Recipient Phone Number or Chat ID", name: "searchChatId", type: "string", default: "", description: "Optional. Use entry[0].changes[0].value.messages[0].from to search only the chat that triggered the workflow.", displayOptions: { show: { resource: ["message"], operation: ["search"] } } },
      { displayName: "Limit", name: "limit", type: "number",
																																													description: 'Max number of results to return', typeOptions: { minValue: 1 }, default: 50, displayOptions: { show: { resource: ["chat"], operation: ["messages"] } } },
      { displayName: "Before Cursor", name: "beforeCursor", type: "string", default: "", description: "The nextCursor returned by the previous message page. Leave empty to load recent messages.", displayOptions: { show: { resource: ["chat"], operation: ["messages"] } } },
      { displayName: "Limit", name: "chatLimit", type: "number", default: 50, typeOptions: { minValue: 1, maxValue: 100 }, description: "Max number of results to return", displayOptions: { show: { resource: ["chat"], operation: ["list"] } } },
      { displayName: "Offset", name: "chatOffset", type: "number", default: 0, typeOptions: { minValue: 0, maxValue: 10000 }, description: "Number of conversations to skip", displayOptions: { show: { resource: ["chat"], operation: ["list"] } } },
      { displayName: "Browser-Compatible Video", name: "browserVideo", type: "boolean", default: false, description: "Whether to convert downloaded videos to browser-compatible MP4 (disabled preserves the original)", displayOptions: { show: { resource: ["message"], operation: ["downloadMedia"] } } },
      { displayName: "Limit", name: "searchLimit", type: "number", typeOptions: { minValue: 1 }, default: 50, displayOptions: { show: { resource: ["message"], operation: ["search"] } } },
      { displayName: "Contact Phone Number or ID", name: "contactId", type: "string", default: "", required: true, placeholder: "15551234567", description: "For a Rimberio trigger contact, use entry[0].changes[0].value.contacts[0].wa_id", displayOptions: { show: { resource: ["contact"], operation: ["get", "check", "profilePic", "block", "unblock"] } } },
      { displayName: "Contact Phone Numbers or IDs", name: "contactIds", type: "string", default: "", required: true, description: "Comma-separated phone numbers or contact IDs to send as contact cards", displayOptions: { show: { resource: ["message"], operation: ["sendContacts"] } } },
      { displayName: "Latitude", name: "latitude", type: "number", default: 0, required: true, displayOptions: { show: { resource: ["message"], operation: ["sendLocation"] } } },
      { displayName: "Longitude", name: "longitude", type: "number", default: 0, required: true, displayOptions: { show: { resource: ["message"], operation: ["sendLocation"] } } },
      { displayName: "Location Name", name: "locationName", type: "string", default: "", displayOptions: { show: { resource: ["message"], operation: ["sendLocation"] } } },
      { displayName: "Address", name: "address", type: "string", default: "", displayOptions: { show: { resource: ["message"], operation: ["sendLocation"] } } },
      { displayName: "Question", name: "question", type: "string", default: "", required: true, displayOptions: { show: { resource: ["message"], operation: ["sendPoll"] } } },
      { displayName: "Options", name: "options", type: "string", default: "", required: true, description: "Comma-separated poll options", displayOptions: { show: { resource: ["message"], operation: ["sendPoll"] } } },
      { displayName: "Allow Multiple Answers", name: "allowMultipleAnswers", type: "boolean", default: false, displayOptions: { show: { resource: ["message"], operation: ["sendPoll"] } } },
      { displayName: "Call Type", name: "callType", type: "options", options: [{ name: "Voice", value: "voice" }, { name: "Video", value: "video" }], default: "voice", displayOptions: { show: { resource: ["message"], operation: ["sendCallLink"] } } },
      { displayName: "Call Message", name: "callMessage", type: "string", default: "", displayOptions: { show: { resource: ["message"], operation: ["sendCallLink"] } } },
      { displayName: "Target Phone Number or Chat ID", name: "targetChatId", type: "string", default: "", required: true, placeholder: "15551234567", description: "The destination for the forwarded message. Phone numbers and group chat IDs are accepted.", displayOptions: { show: { resource: ["message"], operation: ["forward"] } } },
      { displayName: "Pin Duration Seconds", name: "pinDuration", type: "number", default: 604800, typeOptions: { minValue: 60, maxValue: 2592000 }, displayOptions: { show: { resource: ["message"], operation: ["pinMessage"] } } },
      { displayName: "Delete For Everyone", name: "everyone", type: "boolean", default: false, displayOptions: { show: { resource: ["message"], operation: ["delete"] } } },
      { displayName: "Unmute Date", name: "unmuteDate", type: "string", default: "", description: "ISO date. Leave empty to mute indefinitely.", displayOptions: { show: { resource: ["chat"], operation: ["mute"] } } },
      { displayName: "Group ID", name: "groupId", type: "string", default: "", required: true, displayOptions: { show: { resource: ["group"], operation: ["get", "addParticipants", "removeParticipants", "promote", "demote", "inviteCode", "revokeInvite", "setSubject", "setDescription", "leave"] } } },
      { displayName: "Title", name: "title", type: "string", default: "", required: true, displayOptions: { show: { resource: ["group"], operation: ["create"] } } },
      { displayName: "Participants", name: "participants", type: "string", default: "", required: true, description: "Comma-separated phone numbers or contact IDs", displayOptions: { show: { resource: ["group"], operation: ["create", "addParticipants", "removeParticipants", "promote", "demote"] } } },
      { displayName: "Value", name: "value", type: "string", default: "", required: true, displayOptions: { show: { resource: ["group"], operation: ["setSubject", "setDescription"] } } },
      { displayName: "Recipient Phone Number or Chat ID", name: "labelChatId", type: "string", default: "", required: true, placeholder: "15551234567", description: "For a Rimberio trigger, use entry[0].changes[0].value.messages[0].from", displayOptions: { show: { resource: ["label"], operation: ["getChatLabels", "setChatLabels"] } } },
      { displayName: "Label IDs", name: "labelIds", type: "string", default: "", description: "Comma-separated label IDs. Empty clears labels.", displayOptions: { show: { resource: ["label"], operation: ["setChatLabels"] } } },
      { displayName: "Queue ID", name: "queueId", type: "string", default: "", required: true, displayOptions: { show: { resource: ["queue"], operation: ["cancel", "retry"] } } },
      { displayName: "Call ID", name: "callId", type: "string", default: "", required: true, description: "Use the Call ID from a Call Received trigger. This is not the caller phone number.", displayOptions: { show: { resource: ["call"], operation: ["reject"] } } },
      { displayName: "Bypass Native Call Policy Guard", name: "bypassCallPolicyGuard", type: "boolean", default: false, description: "Whether to allow manual rejection even when an enabled native call-rejection policy exists", displayOptions: { show: { resource: ["call"], operation: ["reject"] } } },
      { displayName: "Rule ID", name: "ruleId", type: "string", default: "", required: true, displayOptions: { show: { resource: ["rule"], operation: ["update", "delete"] } } },
      { displayName: "Rule Name", name: "ruleName", type: "string", default: "Call handling policy", required: true, displayOptions: { show: { resource: ["rule"], operation: ["create", "update"] } } },
      { displayName: "Rule Type", name: "ruleType", type: "options", options: [{ name: "Business Hours", value: "business_hours" }, { name: "Call", value: "call" }, { name: "Catch All", value: "catch_all" }, { name: "Keyword", value: "keyword" }, { name: "Regex", value: "regex" }], default: "call", displayOptions: { show: { resource: ["rule"], operation: ["create", "update"] } } },
      { displayName: "Reply Text", name: "ruleReplyText", type: "string", typeOptions: { rows: 3 }, default: "We cannot take WhatsApp calls here. Please send a text and we will reply.", required: true, displayOptions: { show: { resource: ["rule"], operation: ["create", "update"] } } },
      { displayName: "Reject Matching Calls", name: "ruleRejectCall", type: "boolean", default: true, description: "Whether to reject incoming calls matched by call or business-hours rules", displayOptions: { show: { resource: ["rule"], operation: ["create", "update"] } } },
      { displayName: "Cooldown Minutes", name: "ruleCooldownMinutes", type: "number", default: 1440, typeOptions: { minValue: 0 }, displayOptions: { show: { resource: ["rule"], operation: ["create", "update"] } } },
      { displayName: "Enabled", name: "ruleEnabled", type: "boolean", default: true, displayOptions: { show: { resource: ["rule"], operation: ["create", "update"] } } },
      { displayName: "Priority", name: "rulePriority", type: "number", default: 100, displayOptions: { show: { resource: ["rule"], operation: ["create", "update"] } } },
      { displayName: "Chat Scope", name: "ruleChatScope", type: "options", options: [{ name: "All", value: "all" }, { name: "Individual", value: "individual" }, { name: "Group", value: "group" }], default: "individual", displayOptions: { show: { resource: ["rule"], operation: ["create", "update"] } } },
      { displayName: "Match Value", name: "ruleMatchValue", type: "string", default: "", description: 'Required for keyword and regex rules', displayOptions: { show: { resource: ["rule"], operation: ["create", "update"] } } },
      { displayName: "Match Mode", name: "ruleMatchMode", type: "options", options: [{ name: "Contains", value: "contains" }, { name: "Exact", value: "exact" }], default: "contains", displayOptions: { show: { resource: ["rule"], operation: ["create", "update"] } } },
      { displayName: "Business Hours JSON", name: "ruleBusinessHoursJson", type: "string", typeOptions: { rows: 3 }, default: "{\"timezone\":\"Asia/Karachi\",\"days\":[1,2,3,4,5],\"startMinute\":540,\"endMinute\":1080,\"mode\":\"outside\"}", description: 'Required for business-hours rules', displayOptions: { show: { resource: ["rule"], operation: ["create", "update"] } } },
      { displayName: "Test Text", name: "ruleTestText", type: "string", default: "", displayOptions: { show: { resource: ["rule"], operation: ["test"] } } },
      { displayName: "Status Text", name: "statusText", type: "string", typeOptions: { rows: 3 }, default: "", required: true, displayOptions: { show: { resource: ["status"], operation: ["text"] } } },
      { displayName: "Media URL", name: "statusUrl", type: "string", default: "", description: "Image or video URL fetched by the Rimberio server", displayOptions: { show: { resource: ["status"], operation: ["media"] } } },
      { displayName: "Media Base64", name: "statusBase64", type: "string", typeOptions: { rows: 3 }, default: "", description: "Alternative to Media URL; provide the raw base64 payload together with MIME type", displayOptions: { show: { resource: ["status"], operation: ["media"] } } },
      { displayName: "MIME Type", name: "statusMimetype", type: "string", default: "", placeholder: "image/jpeg", description: "Required when Media Base64 is provided", displayOptions: { show: { resource: ["status"], operation: ["media"] } } },
      { displayName: "Caption", name: "statusCaption", type: "string", default: "", displayOptions: { show: { resource: ["status"], operation: ["media"] } } }
    ]
  };

  methods = {
    loadOptions: {
      async getSessions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const credentials = await this.getCredentials("wapiBridgeApi");
        const baseUrl = String(credentials.baseUrl).replace(/\/+$/, "");
        const response = (await this.helpers.requestWithAuthentication.call(this, "wapiBridgeApi", {
          method: "GET",
          uri: `${baseUrl}/v1/whatsapp/sessions`,
          json: true
        })) as { sessions?: Array<{ id: string; phoneNumber?: string; friendlyName?: string; status?: string }> };

        return (response.sessions ?? [])
          .map((session) => ({
            name: session.friendlyName || session.phoneNumber || session.id,
            value: session.id,
            description: `${session.phoneNumber || session.id} · ${session.status || "unknown"}`
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
      }
    }
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const out: INodeExecutionData[] = [];
    const credentials = await this.getCredentials("wapiBridgeApi");
    const baseUrl = String(credentials.baseUrl).replace(/\/+$/, "");

    for (let i = 0; i < items.length; i++) {
      try {
        const resource = this.getNodeParameter("resource", i) as string;
        const operation = this.getNodeParameter("operation", i) as string;
        const sessionId = resource === "session" && operation === "list" ? "" : (this.getNodeParameter(resource === "session" ? "sessionLookupId" : "sessionId", i) as string);
        const sessionBase = `${baseUrl}/v1/whatsapp/sessions${sessionId ? `/${encodeURIComponent(sessionId)}` : ""}`;
        let method: IHttpRequestMethods = "GET";
        let url = "";
        let body: IDataObject | undefined;
        let qs: IDataObject | undefined;

        if (resource === "message") {
          const messageId = () => encodeURIComponent(this.getNodeParameter("messageId", i) as string);
          if (operation === "sendText") {
            method = "POST"; url = `${sessionBase}/messages/text`; body = { to: this.getNodeParameter("to", i), text: this.getNodeParameter("text", i) };
          } else if (operation === "sendMedia") {
            method = "POST"; url = `${sessionBase}/messages/media`; body = { to: this.getNodeParameter("to", i), url: this.getNodeParameter("url", i), caption: this.getNodeParameter("caption", i) || undefined, filename: this.getNodeParameter("filename", i) || undefined };
          } else if (operation === "sendLocation") {
            method = "POST"; url = `${sessionBase}/messages/location`; body = { to: this.getNodeParameter("to", i), latitude: this.getNodeParameter("latitude", i), longitude: this.getNodeParameter("longitude", i), name: this.getNodeParameter("locationName", i) || undefined, address: this.getNodeParameter("address", i) || undefined };
          } else if (operation === "sendPoll") {
            method = "POST"; url = `${sessionBase}/messages/poll`; body = { to: this.getNodeParameter("to", i), question: this.getNodeParameter("question", i), options: csv(this.getNodeParameter("options", i)), allowMultipleAnswers: this.getNodeParameter("allowMultipleAnswers", i) };
          } else if (operation === "sendContacts") {
            method = "POST"; url = `${sessionBase}/messages/contacts`; body = { to: this.getNodeParameter("to", i), contactIds: csv(this.getNodeParameter("contactIds", i)) };
          } else if (operation === "sendCallLink") {
            method = "POST"; url = `${sessionBase}/messages/call-link`; body = { to: this.getNodeParameter("to", i), callType: this.getNodeParameter("callType", i), message: this.getNodeParameter("callMessage", i) || undefined };
          } else if (operation === "sendSticker") {
            method = "POST"; url = `${sessionBase}/messages/sticker`; body = { to: this.getNodeParameter("to", i), url: this.getNodeParameter("url", i) };
          } else if (operation === "reply") {
            method = "POST"; url = `${sessionBase}/messages/${messageId()}/reply`; body = { text: this.getNodeParameter("text", i) };
          } else if (operation === "react") {
            method = "POST"; url = `${sessionBase}/messages/${messageId()}/react`; body = { reaction: this.getNodeParameter("reaction", i) };
          } else if (operation === "forward") {
            method = "POST"; url = `${sessionBase}/messages/${messageId()}/forward`; body = { chatId: this.getNodeParameter("targetChatId", i) };
          } else if (operation === "pinMessage") {
            method = "POST"; url = `${sessionBase}/messages/${messageId()}/pin`; body = { duration: this.getNodeParameter("pinDuration", i) };
          } else if (operation === "unpinMessage" || operation === "star" || operation === "unstar") {
            method = "POST"; url = `${sessionBase}/messages/${messageId()}/${operation === "unpinMessage" ? "unpin" : operation}`;
          } else if (operation === "edit") {
            method = "PUT"; url = `${sessionBase}/messages/${messageId()}`; body = { text: this.getNodeParameter("text", i) };
          } else if (operation === "delete") {
            method = "DELETE"; url = `${sessionBase}/messages/${messageId()}`; qs = { everyone: this.getNodeParameter("everyone", i) };
          } else if (operation === "downloadMedia") {
            url = `${sessionBase}/messages/${messageId()}/media`; qs = { full: "1", browser: this.getNodeParameter("browserVideo", i, false) ? "1" : undefined };
          } else if (operation === "search") {
            url = `${sessionBase}/messages/search`; qs = { query: this.getNodeParameter("query", i), chatId: this.getNodeParameter("searchChatId", i) || undefined, limit: this.getNodeParameter("searchLimit", i) };
          }
        } else if (resource === "chat") {
          const chatId = () => encodeURIComponent(this.getNodeParameter("chatId", i) as string);
          if (operation === "list") { url = `${sessionBase}/chats`; qs = { limit: this.getNodeParameter("chatLimit", i, 50), offset: this.getNodeParameter("chatOffset", i, 0) }; }
          else if (operation === "messages") { url = `${sessionBase}/chats/${chatId()}/messages`; qs = { limit: this.getNodeParameter("limit", i), mode: this.getNodeParameter("beforeCursor", i, "") ? "older" : "recent", before: this.getNodeParameter("beforeCursor", i, "") || undefined }; }
          else if (operation === "markRead") { method = "POST"; url = `${sessionBase}/chats/${chatId()}/seen`; }
          else if (operation === "pinnedMessages") url = `${sessionBase}/chats/${chatId()}/pinned-messages`;
          else if (operation === "profilePic") url = `${sessionBase}/chats/${chatId()}/profile-pic`;
          else if (operation === "presence") url = `${sessionBase}/chats/${chatId()}/presence`;
          else if (operation === "mute") { method = "POST"; url = `${sessionBase}/chats/${chatId()}/mute`; body = { unmuteDate: this.getNodeParameter("unmuteDate", i) || undefined }; }
          else if (["typing", "recording", "clearState", "archive", "unarchive", "pin", "unpin", "unmute", "markUnread", "clear"].includes(operation)) {
            method = "POST"; url = `${sessionBase}/chats/${chatId()}/${operation === "clearState" ? "clear-state" : operation === "markUnread" ? "mark-unread" : operation}`;
            if (operation === "typing" || operation === "recording") body = { durationSeconds: this.getNodeParameter("stateDurationSeconds", i) || undefined };
          }
        } else if (resource === "contact") {
          if (operation === "list") url = `${sessionBase}/contacts`;
          else {
            const contactId = encodeURIComponent(this.getNodeParameter("contactId", i) as string);
            if (operation === "check") url = `${sessionBase}/contacts/registered/${contactId}`;
            else if (operation === "get") url = `${sessionBase}/contacts/${contactId}`;
            else if (operation === "profilePic") url = `${sessionBase}/contacts/${contactId}/profile-pic`;
            else if (operation === "block" || operation === "unblock") { method = "POST"; url = `${sessionBase}/contacts/${contactId}/${operation}`; }
          }
        } else if (resource === "group") {
          const groupId = () => encodeURIComponent(this.getNodeParameter("groupId", i) as string);
          if (operation === "create") { method = "POST"; url = `${sessionBase}/groups`; body = { title: this.getNodeParameter("title", i), participants: csv(this.getNodeParameter("participants", i)) }; }
          else if (operation === "get") url = `${sessionBase}/groups/${groupId()}`;
          else if (["addParticipants", "removeParticipants", "promote", "demote"].includes(operation)) {
            method = operation === "removeParticipants" || operation === "demote" ? "DELETE" : "POST";
            url = `${sessionBase}/groups/${groupId()}/${operation === "addParticipants" || operation === "removeParticipants" ? "participants" : "admins"}`;
            body = { participants: csv(this.getNodeParameter("participants", i)) };
          } else if (operation === "inviteCode") url = `${sessionBase}/groups/${groupId()}/invite-code`;
          else if (operation === "revokeInvite") { method = "POST"; url = `${sessionBase}/groups/${groupId()}/invite-code/revoke`; }
          else if (operation === "setSubject" || operation === "setDescription") { method = "PUT"; url = `${sessionBase}/groups/${groupId()}/${operation === "setSubject" ? "subject" : "description"}`; body = { value: this.getNodeParameter("value", i) }; }
          else if (operation === "leave") { method = "POST"; url = `${sessionBase}/groups/${groupId()}/leave`; }
        } else if (resource === "label") {
          if (operation === "list") url = `${sessionBase}/labels`;
          else {
            const chatId = encodeURIComponent(this.getNodeParameter("labelChatId", i) as string);
            url = `${sessionBase}/labels/chat/${chatId}`;
            if (operation === "setChatLabels") { method = "POST"; body = { labelIds: csv(this.getNodeParameter("labelIds", i)) }; }
          }
        } else if (resource === "queue") {
          if (operation === "usage") url = `${sessionBase}/rate-limit`;
          else if (operation === "queue") url = `${sessionBase}/rate-limit/queue`;
          else {
            const queueId = encodeURIComponent(this.getNodeParameter("queueId", i) as string);
            method = operation === "cancel" ? "DELETE" : "POST";
            url = `${sessionBase}/rate-limit/queue/${queueId}${operation === "retry" ? "/retry" : ""}`;
          }
        } else if (resource === "rule") {
          const ruleBody = () => {
            const ruleType = this.getNodeParameter("ruleType", i) as string;
            return {
              name: this.getNodeParameter("ruleName", i) as string,
              type: ruleType,
              enabled: this.getNodeParameter("ruleEnabled", i) as boolean,
              priority: this.getNodeParameter("rulePriority", i) as number,
              matchValue: this.getNodeParameter("ruleMatchValue", i) || undefined,
              matchMode: this.getNodeParameter("ruleMatchMode", i) as string,
              chatScope: this.getNodeParameter("ruleChatScope", i) as string,
              replyText: this.getNodeParameter("ruleReplyText", i) as string,
              rejectCall: this.getNodeParameter("ruleRejectCall", i) as boolean,
              cooldownMinutes: this.getNodeParameter("ruleCooldownMinutes", i) as number,
              businessHours: ruleType === "business_hours" ? jsonObject(this.getNodeParameter("ruleBusinessHoursJson", i)) : undefined
            };
          };
          if (operation === "list") url = `${sessionBase}/rules`;
          else if (operation === "create") { method = "POST"; url = `${sessionBase}/rules`; body = ruleBody(); }
          else if (operation === "update") {
            const ruleId = encodeURIComponent(this.getNodeParameter("ruleId", i) as string);
            method = "PUT"; url = `${sessionBase}/rules/${ruleId}`; body = ruleBody();
          } else if (operation === "delete") {
            const ruleId = encodeURIComponent(this.getNodeParameter("ruleId", i) as string);
            method = "DELETE"; url = `${sessionBase}/rules/${ruleId}`;
          } else if (operation === "test") {
            method = "POST"; url = `${sessionBase}/rules/test`; body = { text: this.getNodeParameter("ruleTestText", i) || "", chatType: "individual" };
          }
        } else if (resource === "session") {
          if (operation === "list") url = `${baseUrl}/v1/whatsapp/sessions`;
          else if (operation === "get") url = sessionBase;
          else if (operation === "available" || operation === "unavailable") { method = "POST"; url = `${sessionBase}/presence/${operation}`; }
        } else if (resource === "call") {
          if (operation === "list") url = `${sessionBase}/calls`;
          else if (operation === "reject") {
            const bypassPolicyGuard = this.getNodeParameter("bypassCallPolicyGuard", i) as boolean;
            if (!bypassPolicyGuard) {
              const rulesResponse: any = await this.helpers.requestWithAuthentication.call(this, "wapiBridgeApi", {
                method: "GET",
                uri: `${sessionBase}/rules`,
                json: true,
                resolveWithFullResponse: true,
                simple: false
              });
              if ((rulesResponse.statusCode as number) < 400 && hasEnabledNativeCallRejectRule(rulesResponse.body)) {
                throw new NodeOperationError(
                  this.getNode(),
                  "Native call handling is already enabled for this session. Disable the matching Rule resource policy, or turn on 'Bypass Native Call Policy Guard' for this manual call reject node.",
                  { itemIndex: i }
                );
              }
            }
            method = "POST"; url = `${sessionBase}/calls/${encodeURIComponent(this.getNodeParameter("callId", i) as string)}/reject`;
          }
        } else if (resource === "status") {
          if (operation === "text") { method = "POST"; url = `${sessionBase}/status/text`; body = { text: this.getNodeParameter("statusText", i) }; }
          else if (operation === "media") {
            method = "POST"; url = `${sessionBase}/status/media`;
            const statusUrl = this.getNodeParameter("statusUrl", i) as string;
            const statusBase64 = this.getNodeParameter("statusBase64", i) as string;
            const statusMimetype = this.getNodeParameter("statusMimetype", i) as string;
            body = {
              ...(statusUrl ? { url: statusUrl } : {}),
              ...(statusBase64 ? { base64: statusBase64, mimetype: statusMimetype } : {}),
              caption: this.getNodeParameter("statusCaption", i) || undefined
            };
          }
        }

        if (!url) throw new NodeOperationError(this.getNode(), `Unsupported operation ${resource}.${operation}`, { itemIndex: i });

        const options: IRequestOptions = { method, uri: url, json: true, ...(body ? { body } : {}), ...(qs ? { qs } : {}), resolveWithFullResponse: true, simple: false };
        const response: any = await this.helpers.requestWithAuthentication.call(this, "wapiBridgeApi", options);
        const status = response.statusCode as number;
        const payload = response.body;
        if (status >= 400) throw new NodeOperationError(this.getNode(), `Rimberio returned ${status}: ${payload?.message ?? JSON.stringify(payload)}`, { itemIndex: i });
        out.push({ json: { ...payload, queued: status === 202 || payload?.queued === true }, pairedItem: { item: i } });
      } catch (error) {
        if (this.continueOnFail()) {
          out.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
          continue;
        }
        throw error;
      }
    }

    return [out];
  }
}

import type {
  IHookFunctions,
  ILoadOptionsFunctions,
  INodePropertyOptions,
  IWebhookFunctions,
  INodeType,
  INodeTypeDescription,
  IWebhookResponseData
} from "n8n-workflow";

/**
 * Webhook trigger. Registers itself against Rimberio's webhook subscriptions on activation
 * and removes itself on deactivation, so a user never has to paste a URL by hand.
 */
export class RimberioTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Rimberio WhatsApp Trigger",
    name: "rimberioTrigger",
    icon: "file:rimberio.svg",
    group: ["trigger"],
    version: 1,
    subtitle: '={{$parameter["events"].join(", ")}}',
    description: "Starts a workflow when WhatsApp activity reaches your Rimberio bridge",
    defaults: { name: "Rimberio WhatsApp Trigger" },
    inputs: [] as any,
    outputs: ["main"] as any,
    credentials: [{ name: "wapiBridgeApi", required: true }],
    webhooks: [
      {
        name: "default",
        httpMethod: "POST",
        responseMode: "onReceived",
        path: "webhook"
      }
    ],
    properties: [
      {
        displayName: "WhatsApp Number Name or ID",
        name: "sessionId",
        type: "options",
        typeOptions: { loadOptionsMethod: "getSessions" },
        default: "",
        required: true,
        description: "Choose from the list, or specify an ID using an <a href=\"https://docs.n8n.io/code/expressions/\">expression</a>"
      },
      {
        displayName: "Events",
        name: "events",
        type: "multiOptions",
        required: true,
        default: ["message"],
        description: 'Rimberio emits exactly these four events',
        options: [
          { name: "Message Received", value: "message", description: "An inbound message arrived" },
          {
            name: "Message Sent",
            value: "message_sent",
            description: "A rate-limit-queued outbound send completed — the only place a queued send reports its real outcome"
          },
          { name: "Session Status", value: "status", description: "A session connected, disconnected, or failed to authenticate" },
          { name: "Call Received", value: "call", description: "An incoming call" }
        ]
      }
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

  webhookMethods = {
    default: {
      async checkExists(this: IHookFunctions): Promise<boolean> {
        const credentials = await this.getCredentials("wapiBridgeApi");
        const baseUrl = String(credentials.baseUrl).replace(/\/+$/, "");
        const sessionId = this.getNodeParameter("sessionId") as string;
        const webhookUrl = this.getNodeWebhookUrl("default");

        try {
          const existing: any = await this.helpers.requestWithAuthentication.call(this, "wapiBridgeApi", {
            method: "GET",
            uri: `${baseUrl}/v1/whatsapp/sessions/${encodeURIComponent(sessionId)}/webhooks`,
            json: true
          });
          return Array.isArray(existing?.webhooks) && existing.webhooks.some((webhook: any) => webhook?.url === webhookUrl);
        } catch {
          return false;
        }
      },

      async create(this: IHookFunctions): Promise<boolean> {
        const credentials = await this.getCredentials("wapiBridgeApi");
        const baseUrl = String(credentials.baseUrl).replace(/\/+$/, "");
        const sessionId = this.getNodeParameter("sessionId") as string;
        const events = this.getNodeParameter("events") as string[];
        const webhookUrl = this.getNodeWebhookUrl("default");

        await this.helpers.requestWithAuthentication.call(this, "wapiBridgeApi", {
          method: "PUT",
          uri: `${baseUrl}/v1/whatsapp/sessions/${encodeURIComponent(sessionId)}/webhooks`,
          body: { url: webhookUrl, events, enabled: true },
          json: true
        });
        return true;
      },

      async delete(this: IHookFunctions): Promise<boolean> {
        const credentials = await this.getCredentials("wapiBridgeApi");
        const baseUrl = String(credentials.baseUrl).replace(/\/+$/, "");
        const sessionId = this.getNodeParameter("sessionId") as string;

        try {
          await this.helpers.requestWithAuthentication.call(this, "wapiBridgeApi", {
            method: "DELETE",
            uri: `${baseUrl}/v1/whatsapp/sessions/${encodeURIComponent(sessionId)}/webhooks`,
            qs: { url: this.getNodeWebhookUrl("default") },
            json: true
          });
        } catch {
          // Deactivation must not fail loudly if the instance is unreachable or the
          // webhook is already gone — the workflow is being turned off either way.
          return false;
        }
        return true;
      }
    }
  };

  async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
    const body = this.getBodyData();
    return { workflowData: [this.helpers.returnJsonArray([body as any])] };
  }
}

import type {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties
} from "n8n-workflow";

export class WapiBridgeApi implements ICredentialType {
  name = "wapiBridgeApi";
  displayName = "Rimberio API";
  // Keep the internal credential name stable for existing workflows; the editor shows
  // displayName, so users see Rimberio while old saved credentials can still resolve.
  // eslint-disable-next-line n8n-nodes-base/cred-class-field-documentation-url-miscased
  documentationUrl = "https://github.com/buildtheguild/rimberio/blob/main/docs/api.md";

  properties: INodeProperties[] = [
    {
      displayName: "Base URL",
      name: "baseUrl",
      type: "string",
      default: "http://localhost:3000",
      required: true,
      placeholder: "https://rimberio.example.com",
      description: "Where your Rimberio instance is reachable, with no trailing slash"
    },
    {
      displayName: "Token",
      name: "token",
      type: "string",
      typeOptions: { password: true },
      default: "",
      required: true,
      description:
        "Your BRIDGE_TOKEN, or preferably an API key issued from Settings -> API keys. An API key can be revoked on its own and is attributed by name in the audit log."
    }
  ];

  authenticate: IAuthenticateGeneric = {
    type: "generic",
    properties: {
      headers: {
        Authorization: "=Bearer {{$credentials.token}}"
      }
    }
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: "={{$credentials.baseUrl}}",
      url: "/v1/health"
    }
  };
}

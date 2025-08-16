// Message sent TO the iframe
export type OutboundIframeMessage = {
    agentId?: string;
    tenantId?: string;
    instanceId?: string; // Add this field to identify specific instances
    __halosight_outbound?: false | undefined;
} & (
    | {
          action: OutboundIframeActions.INIT;
      }
    | {
          action: OutboundIframeActions.INSERT_AGENT_ARGUMENTS;
          agent_arguments: Record<string, unknown>;
      }
    | {
          action: OutboundIframeActions.INSERT_UI_ATTRIBUTES;
          ui_attributes: Record<string, unknown>;
      }
    | {
          action: OutboundIframeActions.CROSS_IFRAME_MESSAGE;
          payload: CrossIframeMessagePayload;
      }
);

// Message FROM the iframe
export type InboundIframeMessage = {
    instanceId: string;
    chatId?: string;
    __halosight_outbound?: true;
} & (
    | {
          action: InboundIframeActions.REGISTER;
          payload?: undefined;
      }
    | {
          action: InboundIframeActions.AUTO_SCALE_Y;
          payload: {
              height: number;
          };
      }
    | {
          action: InboundIframeActions.CROSS_IFRAME_MESSAGE;
          payload: CrossIframeMessagePayload;
      }
);

export const enum CrossIframeMessageTypes {
    COMPONENT_REGISTRY_UPDATED = 'component_registry_updated',
}

export type AutoScaleYPayload = {
    height: number;
};

export type CrossIframeMessagePayload = {
    targetInstanceId?: string;
    messageType: CrossIframeMessageTypes;
    data: Record<string, unknown>;
    senderInstanceId: string;
};

export const enum InboundIframeActions {
    REGISTER = 'register',
    AUTO_SCALE_Y = 'auto_scale_y',
    CROSS_IFRAME_MESSAGE = 'cross_iframe_message',
}

export const enum OutboundIframeActions {
    INIT = 'init',
    INSERT_AGENT_ARGUMENTS = 'insert_agent_arguments',
    INSERT_UI_ATTRIBUTES = 'insert_ui_attributes',
    CROSS_IFRAME_MESSAGE = 'cross_iframe_message',
}

export const enum ComponentType {
    CHAT = 'chat',
    INSIGHTS = 'insights',
}

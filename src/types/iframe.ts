export type OutboundIframeMessage = {
    agentId?: string;
    tenantId?: string;
    action?: OutboundIframeActions;
    instanceId?: string;
    agent_arguments?: Record<string, unknown>;
    ui_attributes?: Record<string, unknown>;
};

export type InboundIframeMessage = {
    [key: string]: any;
    action: InboundIframeActions;
    instanceId: string;
    chatId: string;
};

export const enum InboundIframeActions {
    REGISTER = 'register',
}

export const enum OutboundIframeActions {
    INIT = 'init',
    INSERT_AGENT_ARGUMENTS = 'insert_agent_arguments',
    INSERT_UI_ATTRIBUTES = 'insert_ui_attributes',
}

export type OutboundIframeMessage = {
    agentId?: string;
    tenantId?: string;
    action?: OutboundIframeActions;
    instanceId?: string;
    agent_arguments?: Record<string, unknown>;
    ui_attributes?: Record<string, unknown>;
};

export type InboundIframeMessage = {
    payload?: Record<string, unknown>;
    action: InboundIframeActions;
    instanceId: string;
    chatId: string;
};

export const enum InboundIframeActions {
    REGISTER = 'register',
    AUTO_SCALE_Y = 'auto_scale_y',
}

export const enum OutboundIframeActions {
    INIT = 'init',
    INSERT_AGENT_ARGUMENTS = 'insert_agent_arguments',
    INSERT_UI_ATTRIBUTES = 'insert_ui_attributes',
}

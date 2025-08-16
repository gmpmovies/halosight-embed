import { ComponentType } from './iframe';

export type HalosightEmbedConfig = {
    iframeId: string;
    agentId: string;
    type?: ComponentType;
    tenantId?: string;
    debug?: boolean;
    getIframeElement?: () => HTMLIFrameElement | null;
};

export type RegisterCallback = () => void;

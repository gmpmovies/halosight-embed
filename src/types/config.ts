import { CustomAction } from './action';
import { ComponentType } from './iframe';

export type HalosightEmbedConfig = {
    iframeId: string;
    agentId: string;
    customChatSkill: string;
    type?: ComponentType;
    tenantId?: string;
    debug?: boolean;
    actions?: CustomAction[];
    getIframeElement?: () => HTMLIFrameElement | null;
};

export type Callback<T = any> = (param?: T) => void;

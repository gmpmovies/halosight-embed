import { BASE_EMBEDDING_URL } from './constants';
import { HalosightEmbedConfig, Callback } from './types/config';
import {
    AutoScaleYPayload,
    ComponentType,
    InboundIframeActions,
    InboundIframeMessage,
    OutboundIframeActions,
    OutboundIframeMessage,
} from './types/iframe';
import { Logger, Log } from './utils/logger';
import { getIframeElement, setIframeHeight } from './utils/dom';
import { InstanceRegistry } from './services/registry.service';
import { MessagingService } from './services/messaging.service';
import { ActionResponse, CustomAction } from './types/action';

export class HalosightEmbed {
    iframeId: string; // iframe Id attribure
    agentId: string;
    customChatSkill?: string;
    actions?: CustomAction[];
    type?: ComponentType;
    instanceId?: string; // Instance Id provided by the iframe
    tenantId?: string;
    pageUrl: string;

    private _debug?: boolean;
    private _iframeElement: HTMLIFrameElement | null = null;
    private _isInitialized: boolean = false;
    private _cleanup: () => void;
    private _isDestroyed: boolean = false;
    private _unloadHandler: (() => void) | null = null;
    private _getIframeElement: () => HTMLIFrameElement | null;

    // Add event listeners storage
    private registerCallbacks: Callback[] = [];
    private actionCallbacks: Callback[] = [];

    constructor(config: HalosightEmbedConfig) {
        this.iframeId = config.iframeId;
        this.agentId = config.agentId;
        this.customChatSkill = config.customChatSkill;
        this.actions = config.actions;
        this.tenantId = config.tenantId;
        this._debug = config.debug;
        this.pageUrl = typeof window !== 'undefined' ? window.location.href : '';

        Logger.getInstance().setDebug(!!config.debug);
        Log.info('Debug mode is enabled for the HalosightEmbed helper.');

        this._getIframeElement = config.getIframeElement || (() => getIframeElement(this.iframeId));

        // Setup cleanup and register iframe
        this._cleanup = this.register();

        // Setup automatic cleanup on page unload
        if (typeof window !== 'undefined') {
            this._unloadHandler = () => this.destroy();
            window.addEventListener('beforeunload', this._unloadHandler);
        }
    }

    get debug(): boolean | undefined {
        return this._debug;
    }

    get iframeElement(): HTMLIFrameElement | null {
        return this._iframeElement;
    }

    set iframeElement(element: HTMLIFrameElement | null) {
        this._iframeElement = element;
    }

    /**
     * Specifies a callback action for after the component has registered
     * @param callback The callback method
     */
    public onRegister(callback: Callback): HalosightEmbed {
        this.registerCallbacks.push(callback);

        if (this._isInitialized && callback) {
            callback();
        }

        return this;
    }

    public onAction(callback: Callback<ActionResponse>): HalosightEmbed {
        this.actionCallbacks.push(callback);

        return this;
    }

    public destroy(): void {
        Log.info('Destroying: ', this);
        if (this._isDestroyed) return;
        this._isDestroyed = true;

        // Remove from registry when destroyed
        if (this.instanceId) {
            InstanceRegistry.unregister(this.instanceId);
        }

        // Call the cleanup function
        if (this._cleanup) {
            this._cleanup();
        }

        // Remove the unload handler
        if (typeof window !== 'undefined' && this._unloadHandler) {
            window.removeEventListener('beforeunload', this._unloadHandler);
            this._unloadHandler = null;
        }

        // Clear callbacks
        this.registerCallbacks = [];
    }

    insertAgentArguments(args: Record<string, unknown>) {
        if (typeof args !== 'object') {
            Log.warn('param args in insertAgentArguments() MUST be an object');
            return;
        }
        this.sendMessage({
            action: OutboundIframeActions.INSERT_AGENT_ARGUMENTS,
            agent_arguments: args,
        });
        return this;
    }

    insertUiAttributes(attrs: Record<string, unknown>) {
        if (typeof attrs !== 'object') {
            Log.warn('param attrs in insertAgentArguments() MUST be an object');
            return;
        }
        this.sendMessage({
            action: OutboundIframeActions.INSERT_UI_ATTRIBUTES,
            ui_attributes: attrs,
        });
        return this;
    }

    private sendMessage(message: OutboundIframeMessage) {
        MessagingService.sendMessage(this.iframeElement, message, this.instanceId);
    }

    private register(): () => void {
        const cleanup = MessagingService.addMessageListener((event) => {
            if (event.origin !== BASE_EMBEDDING_URL) {
                return;
            }
            this._setupFrame();
            if (!this.iframeElement) {
                Log.warn(
                    `Could not find iframe element. Make you you are passing in the correct Id, or that your getIframeElement callback is returning a valid HTMLElement.`
                );
                return;
            }

            if (this.iframeElement.contentWindow !== event.source) {
                return;
            }

            const data = event.data;

            Log.debug('Message received from iframe: ', data);
            switch (data.action) {
                case InboundIframeActions.REGISTER:
                    this.handleComponentRegistered(data);
                    break;
                case InboundIframeActions.AUTO_SCALE_Y:
                    this.handleAutoScaleY(this.iframeElement, data.payload);
                    break;
                case InboundIframeActions.CROSS_IFRAME_MESSAGE:
                    MessagingService.handleCrossIframeMessage(data, this.instanceId || '');
                    break;
                case InboundIframeActions.ACTION:
                    this.handleIframeAction(data);
                    break;
                default:
                    Log.warn(`Unknown inbound action from Halosight iframe`);
            }
        });

        return (): void => {
            this._isInitialized = false;
            this.iframeElement = null;
            cleanup();
        };
    }

    private handleIframeAction(
        message: InboundIframeMessage & { action: InboundIframeActions.ACTION }
    ) {
        this.actionCallbacks.forEach((callback) => {
            try {
                callback(message.payload);
            } catch (err) {
                Log.error('Error in iframeAction callback', err);
            }
        });
    }

    private _setupFrame(): void {
        if (this.iframeElement) return;
        this.iframeElement = this._getIframeElement();
        if (this.iframeElement) {
            this.iframeElement.style.border = 'none';
            this.iframeElement.style.borderRadius = '8px';
            if (this.iframeElement?.src && this.iframeElement.src.split('/').pop()) {
                this.type = this.iframeElement.src.split('/').pop() as ComponentType;
            } else {
                Log.error('No component type detected in iframe URL');
            }
        } else {
            Log.error(`iframe not found`);
            this.destroy();
        }
    }

    private handleAutoScaleY(iframeElement: HTMLIFrameElement, payload?: AutoScaleYPayload) {
        if (!payload) {
            Log.warn('Received autoscale event with no payload, event will be ignored');
            return;
        }
        if (!payload.height) {
            Log.warn('No height property found on autoscale-y event, event will be ignored');
            return;
        }
        setIframeHeight(iframeElement, payload.height);
    }

    private handleComponentRegistered(data: InboundIframeMessage) {
        try {
            this.instanceId = data.instanceId;

            if (this.instanceId) {
                InstanceRegistry.register(this.instanceId, this);
            }

            this.sendMessage({
                agentId: this.agentId,
                tenantId: this.tenantId,
                customChatSkill: this.customChatSkill,
                customChatActions: this.actions,
                action: OutboundIframeActions.INIT,
                payload: this.pageUrl,
            });
            this._isInitialized = true;

            this.registerCallbacks.forEach((callback) => {
                try {
                    callback();
                } catch (callbackErr) {
                    Log.error('Error in onRegister callback', callbackErr);
                }
            });
        } catch (err) {
            Log.error('Error registering halosight component', err);
        }
    }
}

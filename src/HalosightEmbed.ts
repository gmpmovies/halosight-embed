import { BASE_EMBEDDING_URL } from './constants';
import { HalosightEmbedConfig, RegisterCallback } from './types/config';
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

export class HalosightEmbed {
    iframeId: string;
    agentId: string;
    type?: ComponentType;
    instanceId?: string;
    tenantId?: string;

    private _debug?: boolean;
    private _iframeElement: HTMLIFrameElement | null = null;
    private _isInitialized: boolean = false;
    private _cleanup: () => void;
    private _isDestroyed: boolean = false;
    private _unloadHandler: (() => void) | null = null;
    private _getIframeElement: () => HTMLIFrameElement | null;

    // Add event listeners storage
    private registerCallbacks: RegisterCallback[] = [];

    constructor(config: HalosightEmbedConfig) {
        this.iframeId = config.iframeId;
        this.agentId = config.agentId;
        this.tenantId = config.tenantId;
        this.type = config.type;
        this._debug = config.debug;

        Logger.getInstance().setDebug(!!config.debug);
        Log.info('Debug mode is enabled for the HalosightEmbed helper.');

        this._getIframeElement = config.getIframeElement || (() => getIframeElement(this.iframeId));

        // Setup cleanup and register iframe
        this._cleanup = this.register();
    }

    private _setupFrame(): void {
        this.iframeElement = this.iframeElement ? this.iframeElement : this._getIframeElement();
        if (this.iframeElement) {
            if (this.iframeElement?.src && this.iframeElement.src.split('/').pop()) {
                this.type = this.iframeElement.src.split('/').pop() as ComponentType;
            } else {
                Log.error('No component type detected in iframe URL');
            }
        } else {
            Log.error(`iframe not found`);
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
    public onRegister(callback: RegisterCallback): HalosightEmbed {
        this.registerCallbacks.push(callback);

        if (this._isInitialized && callback) {
            callback();
        }

        return this;
    }

    public destroy(): void {
        Log.info('Destroying: ', this);
        if (this._isDestroyed) return;

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
        this._isDestroyed = true;
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
        const handler = (event: MessageEvent<InboundIframeMessage>): void => {
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
                default:
                    Log.warn(`Unknown inbound action from Halosight iframe`);
            }
        };

        window.addEventListener('message', handler);

        return (): void => {
            this._isInitialized = false;
            this.iframeElement = null;
            window.removeEventListener('message', handler);
        };
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
                action: OutboundIframeActions.INIT,
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

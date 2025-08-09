import { BASE_EMBEDDING_URL } from './constants';
import {
    InboundIframeActions,
    InboundIframeMessage,
    OutboundIframeActions,
    OutboundIframeMessage,
} from './types/iframe';

type HalosightEmbedConfig = {
    iframeId: string;
    agentId: string;
    tenantId?: string;
    debug?: boolean;
};

type RegisterCallback = () => void;

export class HalosightEmbed {
    iframeId: string;
    agentId: string;
    instanceId?: string;
    tenantId?: string;

    private _debug?: boolean;
    private _iframeElement: HTMLIFrameElement | null = null;
    private _isInitialized: boolean = false;
    private _cleanup: () => void;
    private _isDestroyed: boolean = false;
    private _unloadHandler: (() => void) | null = null;

    // Add event listeners storage
    private registerCallbacks: RegisterCallback[] = [];

    constructor(config: HalosightEmbedConfig) {
        this.iframeId = config.iframeId;
        this.agentId = config.agentId;
        this.tenantId = config.tenantId;
        this._debug = config.debug;

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
     * Register a callback to be executed when the component is registered
     * @param callback Function to execute when registration is complete
     * @returns this instance for chaining
     */
    onRegister(callback: RegisterCallback): HalosightEmbed {
        this.registerCallbacks.push(callback);

        // If already initialized, execute callback immediately
        if (this._isInitialized && callback) {
            callback();
        }

        return this;
    }

    /**
     * Manually destroy the embed instance and clean up event listeners
     */
    destroy(): void {
        if (this._isDestroyed) return;

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

    /**
     * Insert extra arguments in the agent request (i.e. {accountId: '12345'} to inform the agent of the account to lookup)
     * @param args An object containing arguments to send to the agent.
     * @returns this instance for chaining
     */
    insertAgentArguments(args: Record<string, unknown>) {
        if (typeof args !== 'object') {
            if (this.debug) {
                console.warn('param args in insertAgentArguments() MUST be an object');
            }
            return;
        }
        this.sendMessage({
            action: OutboundIframeActions.INSERT_AGENT_ARGUMENTS,
            agent_arguments: args,
        });
        return this;
    }

    /**
     * Insert extra arrtibutes to fine tune the iframe UI. Refer to documentation for available attributes per component
     * @param attrs An object containing attributes to send to the frame.
     * @returns this instance for chaining
     */
    insertUiAttributes(attrs: Record<string, unknown>) {
        if (typeof attrs !== 'object') {
            if (this.debug) {
                console.warn('param attrs in insertAgentArguments() MUST be an object');
            }
            return;
        }
        this.sendMessage({
            action: OutboundIframeActions.INSERT_UI_ATTRIBUTES,
            ui_attributes: attrs,
        });
    }

    private sendMessage(message: OutboundIframeMessage) {
        try {
            if (!this.instanceId) {
                if (this.debug) {
                    console.warn('No Halosight frame instance found for communication');
                }

                return;
            }
            if (!this.iframeElement) {
                if (this.debug) {
                    console.warn(`Halosight iframe not detected. Has it been registered?`);
                }
                return;
            }
            message = { ...message, instanceId: this.instanceId };
            this.iframeElement.contentWindow!.postMessage(message, BASE_EMBEDDING_URL);
        } catch (err) {
            if (this.debug) {
                console.warn(`Failed to send message to iframe ${this.iframeId}`, err);
            }
        }
    }

    /**
     * Sets up message listener for Halosight iframe and returns callback when initialized
     * @returns A cleanup lifecycle hook
     */
    private register(): () => void {
        const handler = (event: MessageEvent<InboundIframeMessage>): void => {
            // Filter out events that don't from from Halosight
            if (event.origin !== BASE_EMBEDDING_URL) {
                console.log('Received message from unknown origin:', event.origin);
                return;
            }

            // Retrieve the iframe element
            this.iframeElement = this.iframeElement
                ? this.iframeElement
                : this.getElementById(this.iframeId);
            if (!this.iframeElement) {
                if (this.debug) {
                    console.warn(`Could not find iframe by id: ${this.iframeId}`);
                }
                return;
            }

            // Check if the message came from the targeted iframe element.
            if (this.iframeElement.contentWindow !== event.source) {
                return;
            }

            const data = event.data;

            console.log('Message received from iframe:', data);
            switch (data.action) {
                case InboundIframeActions.REGISTER:
                    this.handleComponentRegistered(data);
                    break;
                default:
                    if (this.debug) {
                        console.warn(`Unkown inbound action from Halosight iframe: ${data.action}`);
                    }
            }
        };

        window.addEventListener('message', handler);

        // Return a cleanup function
        const cleanup = (): void => {
            this._isInitialized = false;
            this.iframeElement = null;
            window.removeEventListener('message', handler);
        };

        return cleanup;
    }

    private handleComponentRegistered(data: InboundIframeMessage) {
        try {
            this.instanceId = data.instanceId;
            this.sendMessage({
                agentId: this.agentId,
                tenantId: this.tenantId,
                action: OutboundIframeActions.INIT,
            });
            this._isInitialized = true;

            // Execute all registered callbacks
            this.registerCallbacks.forEach((callback) => {
                try {
                    callback();
                } catch (callbackErr) {
                    console.error('Error in onRegister callback', callbackErr);
                }
            });
        } catch (err) {
            console.error('Error registering halosight component', err);
        }
    }

    /**
     * Safely gets an element by ID (browser only)
     * @param id Element ID
     * @returns HTMLElement or null
     */
    private getElementById(id: string): HTMLIFrameElement | null {
        if (typeof document === 'undefined') {
            if (this.debug) {
                console.warn('getElementById called in non-browser environment');
            }
            return null;
        }

        return document.getElementById(id) as HTMLIFrameElement;
    }
}

// Also export the class as default for flexibility
export default HalosightEmbed;

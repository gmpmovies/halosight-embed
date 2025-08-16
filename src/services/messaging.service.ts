import { BASE_EMBEDDING_URL } from '../constants';
import {
    OutboundIframeMessage,
    InboundIframeMessage,
    OutboundIframeActions,
    CrossIframeMessageTypes,
    InboundIframeActions,
} from '../types/iframe';
import { Log } from '../utils/logger';
import { InstanceRegistry } from './registry.service';

export class MessagingService {
    static sendMessage(
        iframeElement: HTMLIFrameElement | null,
        message: OutboundIframeMessage,
        instanceId?: string
    ): void {
        try {
            if (!instanceId) {
                Log.warn('No Halosight frame instance found for communication');
                return;
            }
            if (!iframeElement) {
                Log.warn(`Halosight iframe not detected. Has it been registered?`);
                return;
            }
            message = { ...message, instanceId };
            Log.debug(`Message sent to ${iframeElement.src} iframe: `, message);
            iframeElement.contentWindow!.postMessage(message, BASE_EMBEDDING_URL);
        } catch (err) {
            Log.warn(`Failed to send message to iframe`, err);
        }
    }

    /**
     * Handles cross-iframe messaging between instances
     * @param data The message data
     * @param senderInstanceId The ID of the sending instance
     */
    static handleCrossIframeMessage(
        data: InboundIframeMessage & { action: InboundIframeActions.CROSS_IFRAME_MESSAGE },
        senderInstanceId: string
    ): void {
        if (!data.payload) {
            Log.warn('Received cross-iframe message with no payload');
            return;
        }

        const { targetInstanceId, messageType } = data.payload;

        // Forward the message using the existing method
        this.sendCrossIframeMessage(
            messageType,
            data.payload.data || {},
            senderInstanceId,
            targetInstanceId
        );
    }

    /**
     * Sends cross iframe message to target iframe. If no targetInstanceId is specified, then all halosight iframes are targeted.
     * @param data The message data
     * @param senderInstanceId The ID of the sending instance
     * @param messageType The type of message (i.e. Register)
     * @param targetInstanceId (Optional) Sends message to specific iframe if defined. Otherwise message is sent to all registered iframes
     */
    static sendCrossIframeMessage(
        messageType: CrossIframeMessageTypes,
        data: Record<string, unknown>,
        senderInstanceId: string,
        targetInstanceId?: string
    ): void {
        if (!senderInstanceId) {
            Log.warn('Cannot send cross-iframe message: no instanceId');
            return;
        }

        if (targetInstanceId) {
            // Send to specific target
            const targetInstance = InstanceRegistry.getInstance(targetInstanceId);
            if (targetInstance && targetInstance.iframeElement) {
                this.sendMessage(
                    targetInstance.iframeElement,
                    {
                        action: OutboundIframeActions.CROSS_IFRAME_MESSAGE,
                        payload: {
                            targetInstanceId,
                            messageType,
                            data,
                            senderInstanceId,
                        },
                    },
                    targetInstanceId
                );
            } else {
                Log.warn(`Target iframe with instanceId ${targetInstanceId} not found`);
            }
        } else {
            // Broadcast to all instances
            InstanceRegistry.getAllInstances().forEach((instance) => {
                if (instance.iframeElement && instance.instanceId) {
                    this.sendMessage(
                        instance.iframeElement,
                        {
                            action: OutboundIframeActions.CROSS_IFRAME_MESSAGE,
                            payload: {
                                targetInstanceId: instance.instanceId,
                                messageType,
                                data,
                                senderInstanceId,
                            },
                        },
                        instance.instanceId
                    );
                }
            });
        }
    }
}

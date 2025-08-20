import { HalosightEmbed } from '../HalosightEmbed';
import { CrossIframeMessageTypes } from '../types/iframe';
import { Log } from '../utils/logger';
import { MessagingService } from './messaging.service';

export class InstanceRegistry {
    private static _instances: Map<string, HalosightEmbed> = new Map();

    static register(instanceId: string, instance: HalosightEmbed): void {
        this._instances.set(instanceId, instance);
        this.notifyRegistryChange(instanceId);
    }

    static unregister(instanceId: string): void {
        this._instances.delete(instanceId);
        Log.info('Instance has been unregistered', instanceId);
        Log.info('Available instances', this._instances);
        this.notifyRegistryChange(instanceId);
    }

    static getInstance(instanceId: string): HalosightEmbed | undefined {
        return this._instances.get(instanceId);
    }

    /**
     * Returns all instances that are on the same pageRef as the sourceInstance
     * @param sourceInstance
     */
    static getAllMatchingPageInstances(sourceInstanceId: string): HalosightEmbed[] {
        const sourceInstance = InstanceRegistry.getInstance(sourceInstanceId);
        if (!sourceInstance) return [];
        return Array.from(this._instances.values()).filter(
            (instance) => instance.pageUrl === sourceInstance.pageUrl
        );
    }

    static getAllInstances(): HalosightEmbed[] {
        return Array.from(this._instances.values());
    }

    /**
     * Notifies all instances about changes in the instance registry
     * @param senderInstanceId The ID of the instance that triggered the change
     */
    static notifyRegistryChange(senderInstanceId: string): void {
        if (!senderInstanceId) {
            Log.warn('Cannot notify registry change: no instanceId provided');
            return;
        }

        // Map of registry data for all instances on the same page as the sender
        const registryData = {
            registered_components: InstanceRegistry.getAllMatchingPageInstances(
                senderInstanceId
            ).map((instance) => ({
                type: instance.type,
                instanceId: instance.instanceId,
                agentId: instance.agentId,
            })),
        };

        // Use the existing MessagingService to broadcast the registry update
        MessagingService.sendCrossIframeMessage(
            CrossIframeMessageTypes.COMPONENT_REGISTRY_UPDATED,
            registryData,
            senderInstanceId
            // No targetInstanceId means broadcast to all
        );
    }
}

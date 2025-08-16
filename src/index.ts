import { HalosightEmbed } from './HalosightEmbed';
export * from './types/iframe';
export * from './types/config';
export { Logger, Log } from './utils/logger';
export { InstanceRegistry } from './services/registry.service';
export { MessagingService } from './services/messaging.service';

// Export the main class
export { HalosightEmbed };

// Also export as default for flexibility
export default HalosightEmbed;

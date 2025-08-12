# Halosight Embedding Helper

A lightweight JavaScript library for embedding and interacting with Halosight agents in your web applications.

## Installation

```bash
npm install halosight-embedding-helper
```

or

```bash
yarn add halosight-embedding-helper
```

## Usage

### Basic Setup

```javascript
// File: /path/to/your/app.js
import HalosightEmbed from 'halosight-embedding-helper';

// Create an iframe element in your HTML
// <iframe id="halosight-agent" src="https://embed.halosight.com/chat"></iframe>

// Initialize the embedding helper
const halosightEmbed = new HalosightEmbed({
    iframeId: 'halosight-agent',
    agentId: 'your-agent-id',
    tenantId: 'your-tenant-id',
    debug: false, // Set to true for verbose logging
});
```

### Advanced Configuration

You can provide a custom function to retrieve the iframe element:

```javascript
// File: /path/to/your/app.js
const halosightEmbed = new HalosightEmbed({
    agentId: 'your-agent-id',
    getIframeElement: () => document.querySelector('.my-custom-iframe-selector'),
});
```

### Event Handling

Register callbacks to be executed when the Halosight agent is fully initialized:

```javascript
// File: /path/to/your/app.js
halosightEmbed.onRegister(() => {
    console.log('Halosight agent is ready!');

    // You can now interact with the agent
    halosightEmbed.insertAgentArguments({
        accountId: '12345',
        userId: 'user-789',
    });
});
```

### Passing Data to the Agent

You can pass contextual data to the Halosight agent:

```javascript
// File: /path/to/your/app.js
// Pass arguments to the agent
halosightEmbed.insertAgentArguments({
    accountId: '12345',
    customerId: 'cust-789',
});

// Customize the UI appearance
halosightEmbed.insertUiAttributes({
    title: 'My Cool Title',
});
```

### Cleanup

The library automatically cleans up when the page unloads, but you can manually destroy the instance:

```javascript
// File: /path/to/your/app.js
// When you're done with the embed
halosightEmbed.destroy();
```

## API Reference

### `HalosightEmbed`

#### Constructor Options

| Option             | Type     | Required | Description                                    |
| ------------------ | -------- | -------- | ---------------------------------------------- |
| `iframeId`         | string   | Yes      | The ID of the iframe element                   |
| `agentId`          | string   | Yes      | The ID of the Halosight agent                  |
| `tenantId`         | string   | No       | Your Halosight tenant ID                       |
| `debug`            | boolean  | No       | Enable debug logging                           |
| `getIframeElement` | function | No       | Custom function to retrieve the iframe element |

#### Methods

| Method                 | Parameters                     | Returns        | Description                                           |
| ---------------------- | ------------------------------ | -------------- | ----------------------------------------------------- |
| `onRegister`           | callback: () => void           | HalosightEmbed | Register a callback for when the agent is initialized |
| `insertAgentArguments` | args: Record<string, unknown>  | HalosightEmbed | Pass arguments to the agent                           |
| `insertUiAttributes`   | attrs: Record<string, unknown> | HalosightEmbed | Customize the UI appearance                           |
| `destroy`              | none                           | void           | Clean up the embed instance                           |

#### Properties

| Property        | Type              | Description                   |
| --------------- | ----------------- | ----------------------------- |
| `iframeId`      | string            | The ID of the iframe element  |
| `agentId`       | string            | The ID of the Halosight agent |
| `tenantId`      | string            | Your Halosight tenant ID      |
| `debug`         | boolean           | Whether debug mode is enabled |
| `iframeElement` | HTMLIFrameElement | The iframe DOM element        |

## Troubleshooting

- If the iframe isn't found, check that the `iframeId` matches your HTML or provide a custom `getIframeElement` function.
- Enable `debug: true` to see detailed logs of the communication between your page and the Halosight agent.
- Make sure your iframe's `src` is pointing to the correct Halosight embedding URL.

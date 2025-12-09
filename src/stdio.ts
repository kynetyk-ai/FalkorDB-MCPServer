#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { FalkorDB } from 'falkordb';
import { config } from './config';

let client: FalkorDB | null = null;

async function getClient(): Promise<FalkorDB> {
  if (!client) {
    client = await FalkorDB.connect({
      socket: {
        host: config.falkorDB.host,
        port: config.falkorDB.port,
      },
      password: config.falkorDB.password || undefined,
      username: config.falkorDB.username || undefined,
    });
  }
  return client;
}

const server = new Server(
  {
    name: 'falkordb-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_graphs',
        description: 'List all available graphs in the FalkorDB database',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'execute_query',
        description: 'Execute a Cypher query on a FalkorDB graph',
        inputSchema: {
          type: 'object',
          properties: {
            graphName: {
              type: 'string',
              description: 'The name of the graph to query',
            },
            query: {
              type: 'string',
              description: 'The Cypher query to execute',
            },
            params: {
              type: 'object',
              description: 'Optional parameters for the query',
            },
          },
          required: ['graphName', 'query'],
        },
      },
      {
        name: 'get_schema',
        description: 'Get the schema (node labels, relationship types, and properties) of a FalkorDB graph',
        inputSchema: {
          type: 'object',
          properties: {
            graphName: {
              type: 'string',
              description: 'The name of the graph to get schema for',
            },
          },
          required: ['graphName'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const db = await getClient();

    switch (name) {
      case 'list_graphs': {
        const graphs = await db.list();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ graphs }, null, 2),
            },
          ],
        };
      }

      case 'execute_query': {
        const { graphName, query, params } = args as {
          graphName: string;
          query: string;
          params?: Record<string, any>;
        };

        if (!graphName || !query) {
          throw new Error('graphName and query are required');
        }

        const graph = db.selectGraph(graphName);
        const result = await graph.query(query, params);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_schema': {
        const { graphName } = args as { graphName: string };

        if (!graphName) {
          throw new Error('graphName is required');
        }

        const graph = db.selectGraph(graphName);

        // Get node labels
        const labelsResult = await graph.query('CALL db.labels()');
        const labels = labelsResult.data?.map((row: any) => row[0]) || [];

        // Get relationship types
        const relsResult = await graph.query('CALL db.relationshipTypes()');
        const relationshipTypes = relsResult.data?.map((row: any) => row[0]) || [];

        // Get property keys
        const propsResult = await graph.query('CALL db.propertyKeys()');
        const propertyKeys = propsResult.data?.map((row: any) => row[0]) || [];

        const schema = {
          graphName,
          labels,
          relationshipTypes,
          propertyKeys,
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(schema, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('FalkorDB MCP Server running on stdio');

  // Graceful shutdown when stdin closes (client disconnects)
  process.stdin.on('end', async () => {
    if (client) {
      await client.close();
    }
    process.exit(0);
  });

  process.stdin.on('close', async () => {
    if (client) {
      await client.close();
    }
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

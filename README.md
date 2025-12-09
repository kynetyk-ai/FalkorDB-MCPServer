# FalkorDB MCP Server

A Model Context Protocol (MCP) server for FalkorDB, allowing AI models to query and interact with graph databases.

## Overview

This project implements a server that follows the Model Context Protocol (MCP) specification to connect AI models with FalkorDB graph databases. The server translates and routes MCP requests to FalkorDB and formats the responses according to the MCP standard.

## Prerequisites

* Node.js (v16 or later)
* npm or yarn
* FalkorDB instance (can be run locally or remotely)

## Installation

1. Clone this repository:

   ```bash
   git clone https://github.com/falkordb/falkordb-mcpserver.git
   cd falkordb-mcpserver
   ```
2. Install dependencies:

   ```bash
   npm install
   ```
3. Copy the example environment file and configure it:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration details.

## Configuration

Configuration is managed through environment variables in the `.env` file:

* `PORT`: Server port (default: 3000)
* `NODE_ENV`: Environment (development, production)
* `FALKORDB_HOST`: FalkorDB host (default: localhost)
* `FALKORDB_PORT`: FalkorDB port (default: 6379)
* `FALKORDB_USERNAME`: Username for FalkorDB authentication (if required)
* `FALKORDB_PASSWORD`: Password for FalkorDB authentication (if required)
* `MCP_API_KEY`: API key for authenticating MCP requests

## Usage

### Development

Start the development server with hot-reloading:

```bash
# HTTP server (REST API)
npm run dev

# stdio server (for Claude Desktop)
npm run dev:stdio
```

### Production

Build and start the server:

```bash
npm run build

# HTTP server (REST API on port 3000)
npm start

# stdio server (for Claude Desktop/MCP clients)
npm run start:stdio
```

## Transport Modes

This server supports two transport modes:

| Mode | Command | Use Case |
|------|---------|----------|
| **HTTP** | `npm start` | REST API on port 3000 for programmatic access |
| **stdio** | `npm run start:stdio` | For Claude Desktop and MCP clients via stdin/stdout |

## Available Tools (stdio mode)

When using stdio mode, the following MCP tools are available:

| Tool | Description | Parameters |
|------|-------------|------------|
| `list_graphs` | List all graphs in the database | None |
| `execute_query` | Execute a Cypher query | `graphName` (required), `query` (required), `params` (optional) |
| `get_schema` | Get schema info for a graph | `graphName` (required) |

## API Endpoints

* `GET /api/mcp/metadata`: Get metadata about the FalkorDB instance and available capabilities
* `POST /api/mcp/context`: Execute queries against FalkorDB
* `GET /api/mcp/health`: Check server health
* `GET /api/mcp/graphs`: Returns the list of Graphs
* 

## Claude Desktop Integration

To use this server with Claude Desktop, add the following to your `claude_desktop_config.json`:

**Using Docker (recommended):**

First, ensure your FalkorDB container and this MCP server are on the same Docker network:

```bash
# Create a network and connect FalkorDB to it
docker network create falkordb-net
docker network connect falkordb-net <your-falkordb-container>

# Build the MCP server image
npm run docker:build
```

Then add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "falkordb": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "--network", "falkordb-net",
        "-e", "FALKORDB_HOST=<your-falkordb-container>",
        "-e", "FALKORDB_PORT=6379",
        "falkordb-mcpserver"
      ]
    }
  }
}
```

**Using Node.js directly:**

```json
{
  "mcpServers": {
    "falkordb": {
      "command": "node",
      "args": ["/path/to/falkordb-mcpserver/dist/stdio.js"],
      "env": {
        "FALKORDB_HOST": "localhost",
        "FALKORDB_PORT": "6379"
      }
    }
  }
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

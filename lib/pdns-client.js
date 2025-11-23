const axios = require('axios');

const API_URL = process.env.PDNS_API_URL || 'http://localhost:8081';
const API_KEY = process.env.PDNS_API_KEY || '';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
  }
});

// Get all servers
async function getServers() {
  const response = await client.get('/api/v1/servers');
  return response.data;
}

// Get all zones for a server
async function getZones(serverId) {
  const response = await client.get(`/api/v1/servers/${serverId}/zones`);
  return response.data;
}

// Get a specific zone
async function getZone(serverId, zoneId) {
  const response = await client.get(`/api/v1/servers/${serverId}/zones/${zoneId}`);
  return response.data;
}

// Create a new zone
async function createZone(serverId, zoneData) {
  // Ensure zone name ends with a dot (canonical form required by PowerDNS)
  if (zoneData.name && !zoneData.name.endsWith('.')) {
    zoneData.name = zoneData.name + '.';
  }
  
  // Ensure kind is properly set
  if (!zoneData.kind) {
    zoneData.kind = 'Zone';
  }
  
  try {
    const response = await client.post(`/api/v1/servers/${serverId}/zones`, zoneData);
    return response.data;
  } catch (error) {
    // Extract meaningful error message from PowerDNS API
    if (error.response && error.response.data && error.response.data.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
}

// Delete a zone
async function deleteZone(serverId, zoneId) {
  const response = await client.delete(`/api/v1/servers/${serverId}/zones/${zoneId}`);
  return response.data;
}

// Update records in a zone
async function updateRecords(serverId, zoneId, rrsets) {
  const response = await client.patch(`/api/v1/servers/${serverId}/zones/${zoneId}`, rrsets);
  return response.data;
}

// Get server statistics
async function getStatistics(serverId) {
  const response = await client.get(`/api/v1/servers/${serverId}/statistics`);
  return response.data;
}

// Search for records
async function search(serverId, query) {
  const response = await client.get(`/api/v1/servers/${serverId}/search-data`, {
    params: { q: query, max: 100 }
  });
  return response.data;
}

// Get server configuration
async function getConfig(serverId) {
  const response = await client.get(`/api/v1/servers/${serverId}/config`);
  return response.data;
}

// Update server configuration
async function updateConfig(serverId, config) {
  const response = await client.put(`/api/v1/servers/${serverId}/config`, config);
  return response.data;
}

// Get zone metadata
async function getZoneMetadata(serverId, zoneId) {
  const response = await client.get(`/api/v1/servers/${serverId}/zones/${zoneId}/metadata`);
  return response.data;
}

// Update zone metadata
async function updateZoneMetadata(serverId, zoneId, metadata) {
  const response = await client.put(`/api/v1/servers/${serverId}/zones/${zoneId}/metadata`, metadata);
  return response.data;
}

module.exports = {
  getServers,
  getZones,
  getZone,
  createZone,
  deleteZone,
  updateRecords,
  getStatistics,
  search,
  getConfig,
  updateConfig,
  getZoneMetadata,
  updateZoneMetadata
};

/**
 * NDash - PowerDNS Dashboard
 *
 * Built with GitHub Copilot (Grok Code Fast 1)
 * AI-assisted development for enhanced productivity and code quality
 *
 * Copyright (c) 2025 NDash Project
 * All rights reserved.
 *
 * This software is provided as-is without warranty.
 * Use at your own risk.
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const pdnsClient = require('./lib/pdns-client');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for CDN resources
}));
app.use(compression());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'ndash-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Authentication middleware
function requireAuth(req, res, next) {
  if (req.session.authenticated) {
    return next();
  }
  res.redirect('/login');
}

// Routes
app.get('/login', (req, res) => {
  // If already authenticated, redirect to dashboard
  if (req.session.authenticated) {
    return res.redirect('/');
  }
  res.render('login', {
    title: 'Login',
    appName: 'NDash PowerDNS Dashboard',
    error_msg: req.query.error || ''
  });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Simple authentication - in production, use proper authentication
  const validUsername = process.env.ADMIN_USERNAME || 'admin';
  const validPassword = process.env.ADMIN_PASSWORD || 'admin123';

  if (username === validUsername && password === validPassword) {
    req.session.authenticated = true;
    req.session.username = username;
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Invalid username or password' });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction error:', err);
    }
    res.redirect('/login');
  });
});
app.get('/', requireAuth, (req, res) => {
  res.render('index', {
    title: 'NDash - PowerDNS Dashboard',
    page: 'dashboard',
    username: req.session.username
  });
});

app.get('/zones', requireAuth, (req, res) => {
  res.render('zones', {
    title: 'DNS Zones - NDash',
    page: 'zones',
    username: req.session.username
  });
});

app.get('/statistics', requireAuth, (req, res) => {
  res.render('statistics', {
    title: 'Statistics - NDash',
    page: 'statistics',
    username: req.session.username
  });
});

app.get('/settings', requireAuth, (req, res) => {
  res.render('settings', {
    title: 'Settings - NDash',
    page: 'settings',
    username: req.session.username
  });
});

// API Routes - Servers
app.get('/api/servers', requireAuth, async (req, res) => {
  try {
    const servers = await pdnsClient.getServers();
    res.json(servers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API Routes - Zones
app.get('/api/servers/:serverId/zones', requireAuth, async (req, res) => {
  try {
    const zones = await pdnsClient.getZones(req.params.serverId);
    res.json(zones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/servers/:serverId/zones/:zoneId', requireAuth, async (req, res) => {
  try {
    const zone = await pdnsClient.getZone(req.params.serverId, req.params.zoneId);
    res.json(zone);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/servers/:serverId/zones', requireAuth, async (req, res) => {
  try {
    console.log('Creating zone with data:', req.body);
    const zone = await pdnsClient.createZone(req.params.serverId, req.body);
    res.json(zone);
  } catch (error) {
    console.error('Error creating zone:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/servers/:serverId/zones/:zoneId', requireAuth, async (req, res) => {
  try {
    await pdnsClient.deleteZone(req.params.serverId, req.params.zoneId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API Routes - Records
app.patch('/api/servers/:serverId/zones/:zoneId', requireAuth, async (req, res) => {
  try {
    await pdnsClient.updateRecords(req.params.serverId, req.params.zoneId, req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Statistics
app.get('/api/servers/:serverId/statistics', requireAuth, async (req, res) => {
  try {
    const stats = await pdnsClient.getStatistics(req.params.serverId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Service Management API
const fs = require('fs').promises;
const crypto = require('crypto');

const SERVICES_CONFIG_FILE = path.join(__dirname, 'services-config.json');

// Split-Horizon configuration
const SPLIT_HORIZON_CONFIG_FILE = path.join(__dirname, 'split-horizon-config.json');

// Helper function to read split-horizon config
async function readSplitHorizonConfig() {
  try {
    const data = await fs.readFile(SPLIT_HORIZON_CONFIG_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Return default config if file doesn't exist
    return {
      enabled: false,
      zones: [],
      subnets: {
        internal: ['192.168.0.0/16', '10.0.0.0/8', '172.16.0.0/12'],
        external: ['0.0.0.0/0']
      }
    };
  }
}

// Helper function to write split-horizon config
async function writeSplitHorizonConfig(config) {
  try {
    await fs.writeFile(SPLIT_HORIZON_CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Error writing split-horizon config:', error);
  }
}

// Helper function to read services config
async function readServicesConfig() {
  try {
    const data = await fs.readFile(SERVICES_CONFIG_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Return default services if file doesn't exist
    return [
      { id: 'pdns', name: 'PowerDNS', type: 'systemctl', target: 'pdns', enabled: true },
      { id: 'nginx', name: 'Nginx', type: 'systemctl', target: 'nginx', enabled: true },
      { id: 'ssh', name: 'SSH', type: 'systemctl', target: 'ssh', enabled: true },
      { id: 'mysql', name: 'MySQL', type: 'systemctl', target: 'mysql', enabled: true },
      { id: 'postgresql', name: 'PostgreSQL', type: 'systemctl', target: 'postgresql', enabled: true }
    ];
  }
}

// Helper function to write services config
async function writeServicesConfig(services) {
  try {
    await fs.writeFile(SERVICES_CONFIG_FILE, JSON.stringify(services, null, 2));
  } catch (error) {
    console.error('Error writing services config:', error);
  }
}

// Helper function to check service status
async function checkServiceStatus(service) {
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);

  try {
    let command = '';
    let expectedOutput = '';

    switch (service.type) {
      case 'systemctl':
        command = `systemctl is-active ${service.target}`;
        expectedOutput = 'active';
        break;
      
      case 'process':
        command = `ps aux | grep -v grep | grep "${service.target}" | wc -l`;
        expectedOutput = '1';
        break;
      
      case 'port':
        const protocol = service.protocol || 'tcp';
        command = `ss -ln | grep ":${service.target} " | grep "${protocol.toUpperCase()}" | wc -l`;
        expectedOutput = '1';
        break;
      
      case 'custom':
        command = service.target;
        expectedOutput = '0'; // Exit code 0 means success
        break;
      
      default:
        return 'unknown';
    }

    const { stdout, stderr } = await execAsync(command);
    const output = stdout.trim() || stderr.trim();
    
    if (service.type === 'custom') {
      // For custom commands, check exit code (0 = success)
      return 'running';
    } else {
      return output === expectedOutput ? 'running' : 'stopped';
    }
  } catch (error) {
    return 'stopped';
  }
}

// GET /api/services - Get all services
app.get('/api/services', requireAuth, async (req, res) => {
  try {
    const services = await readServicesConfig();
    
    // Check status for each service
    const servicesWithStatus = await Promise.all(
      services.filter(s => s.enabled).map(async (service) => ({
        ...service,
        status: await checkServiceStatus(service)
      }))
    );
    
    res.json(servicesWithStatus);
  } catch (error) {
    console.error('Error reading services:', error);
    res.status(500).json({ error: 'Failed to read services configuration' });
  }
});

// POST /api/services - Add new service
app.post('/api/services', requireAuth, async (req, res) => {
  try {
    const { name, type, target, protocol } = req.body;
    
    if (!name || !type || !target) {
      return res.status(400).json({ error: 'Name, type, and target are required' });
    }

    const services = await readServicesConfig();
    
    // Generate unique ID
    const id = crypto.randomBytes(8).toString('hex');
    
    const newService = {
      id,
      name,
      type,
      target,
      protocol: protocol || 'tcp',
      enabled: true
    };
    
    services.push(newService);
    await writeServicesConfig(services);
    
    res.json(newService);
  } catch (error) {
    console.error('Error adding service:', error);
    res.status(500).json({ error: 'Failed to add service' });
  }
});

// DELETE /api/services/:id - Delete service
app.delete('/api/services/:id', requireAuth, async (req, res) => {
  try {
    const services = await readServicesConfig();
    const filteredServices = services.filter(s => s.id !== req.params.id);
    
    if (filteredServices.length === services.length) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    await writeServicesConfig(filteredServices);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

// GET /api/services/:id/test - Test service
app.get('/api/services/:id/test', requireAuth, async (req, res) => {
  try {
    const services = await readServicesConfig();
    const service = services.find(s => s.id === req.params.id);
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    const status = await checkServiceStatus(service);
    
    res.json({
      success: true,
      service,
      status
    });
  } catch (error) {
    console.error('Error testing service:', error);
    res.status(500).json({ error: 'Failed to test service' });
  }
});

// Get zone metadata
app.get('/api/servers/:serverId/zones/:zoneId/metadata', requireAuth, async (req, res) => {
  try {
    const metadata = await pdnsClient.getZoneMetadata(req.params.serverId, req.params.zoneId);
    res.json(metadata);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update zone metadata
app.put('/api/servers/:serverId/zones/:zoneId/metadata', requireAuth, async (req, res) => {
  try {
    const metadata = await pdnsClient.updateZoneMetadata(req.params.serverId, req.params.zoneId, req.body);
    res.json(metadata);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get server configuration
app.get('/api/servers/:serverId/config', requireAuth, async (req, res) => {
  try {
    const config = await pdnsClient.getConfig(req.params.serverId);
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update server configuration
app.put('/api/servers/:serverId/config', requireAuth, async (req, res) => {
  try {
    const config = await pdnsClient.updateConfig(req.params.serverId, req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Split-Horizon API endpoints
app.get('/api/split-horizon/config', requireAuth, async (req, res) => {
  try {
    const config = await readSplitHorizonConfig();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/split-horizon/config', requireAuth, async (req, res) => {
  try {
    const config = req.body;
    await writeSplitHorizonConfig(config);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get ACL for a zone
app.get('/api/servers/:serverId/zones/:zoneId/acl', requireAuth, async (req, res) => {
  try {
    const metadata = await pdnsClient.getZoneMetadata(req.params.serverId, req.params.zoneId);
    const aclMetadata = metadata.find(m => m.kind === 'ACL');
    res.json(aclMetadata ? aclMetadata.value : []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update ACL for a zone
app.put('/api/servers/:serverId/zones/:zoneId/acl', requireAuth, async (req, res) => {
  try {
    const acl = req.body.acl || [];
    const metadata = [{
      kind: 'ACL',
      value: acl
    }];
    
    await pdnsClient.updateZoneMetadata(req.params.serverId, req.params.zoneId, metadata);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// System Information API
app.get('/api/system-info', requireAuth, async (req, res) => {
  const os = require('os');
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);

  try {
    // CPU Information
    const cpus = os.cpus();
    const cpuUsage = cpus.map(cpu => {
      const total = Object.values(cpu.times).reduce((acc, time) => acc + time, 0);
      const idle = cpu.times.idle;
      return {
        model: cpu.model,
        speed: cpu.speed,
        usage: ((total - idle) / total * 100).toFixed(1)
      };
    });

    // Memory Information
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsage = ((usedMemory / totalMemory) * 100).toFixed(1);

    // Disk Information
    let diskInfo = { total: 'N/A', used: 'N/A', available: 'N/A', usage: 'N/A' };
    try {
      const { stdout } = await execAsync('df -h / | tail -1');
      const parts = stdout.trim().split(/\s+/);
      if (parts.length >= 6) {
        diskInfo = {
          total: parts[1],
          used: parts[2],
          available: parts[3],
          usage: parts[4]
        };
      }
    } catch (error) {
      console.error('Error getting disk info:', error);
    }

    // Services Information (from config)
    const servicesConfig = await readServicesConfig();
    const enabledServices = servicesConfig.filter(s => s.enabled);
    
    const serviceStatuses = await Promise.all(
      enabledServices.map(async (service) => ({
        name: service.name,
        status: await checkServiceStatus(service)
      }))
    );

    res.json({
      cpu: {
        model: cpuUsage[0]?.model || 'Unknown',
        cores: cpus.length,
        speed: cpuUsage[0]?.speed || 0,
        usage: cpuUsage[0]?.usage || 0
      },
      memory: {
        total: (totalMemory / 1024 / 1024 / 1024).toFixed(1) + ' GB',
        used: (usedMemory / 1024 / 1024 / 1024).toFixed(1) + ' GB',
        free: (freeMemory / 1024 / 1024 / 1024).toFixed(1) + ' GB',
        usage: memoryUsage
      },
      disk: diskInfo,
      services: serviceStatuses,
      uptime: Math.floor(os.uptime() / 3600) + 'h ' + Math.floor((os.uptime() % 3600) / 60) + 'm',
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch()
    });
  } catch (error) {
    console.error('Error in system-info:', error);
    res.status(500).json({ error: 'Failed to get system information' });
  }
});

// Error handling
app.use((req, res) => {
  res.status(404).render('error', {
    title: '404 - Not Found',
    message: 'Page not found',
    page: 'error'
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    title: '500 - Server Error',
    message: err.message || 'Something went wrong',
    page: 'error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 NDash PowerDNS Dashboard running on http://localhost:${PORT}`);
  console.log(`📡 PowerDNS API: ${process.env.PDNS_API_URL}`);
});

# Security Best Practices

This document outlines the security measures implemented in Bitaxe Monitor.

## Read-Only Access

- **Current Implementation**: The app is designed with read-only access to miners. No write operations are performed.
- **Future Write Operations**: If write capabilities are added later, they will require:
  - Separate authentication layer
  - Explicit permission checks
  - Audit logging of all write operations

## Input Validation

- All user inputs are validated using `express-validator`
- IP addresses are validated using regex patterns
- Port numbers are validated to be within valid range (1-65535)
- SQL injection prevention through parameterized queries

## Network Security

- **Rate Limiting**: API endpoints are protected with rate limiting (100 requests per 15 minutes per IP)
- **CORS**: Cross-Origin Resource Sharing is restricted to the frontend URL only
- **Helmet.js**: Security headers are set using Helmet middleware
- **Local Network Only**: All miner communication occurs on the local network

## Data Privacy

- **Local Storage**: All data is stored locally on the UmbrelOS node
- **No External Transmission**: No data is sent to external servers
- **Encrypted Configuration**: Sensitive configuration (API keys) is stored in the database
- **Data Retention**: Historical data is automatically cleaned up after 4 hours

## Authentication & Authorization

- Currently, the app runs on the local network and relies on UmbrelOS network security
- For production deployments, consider adding:
  - User authentication
  - Role-based access control
  - Session management

## API Security

- **Input Sanitization**: All inputs are sanitized before processing
- **Error Handling**: Errors don't expose sensitive information in production
- **Timeout Protection**: API requests to miners have 5-second timeouts
- **Connection Validation**: IP addresses are validated before making requests

## Recommendations

1. **HTTPS**: Use HTTPS in production (configure through UmbrelOS)
2. **Firewall**: Ensure proper firewall rules are in place
3. **Regular Updates**: Keep dependencies updated
4. **Monitoring**: Monitor for unusual activity
5. **Backup**: Regularly backup configuration data

## Reporting Security Issues

If you discover a security vulnerability, please report it responsibly. Do not create public GitHub issues for security vulnerabilities.

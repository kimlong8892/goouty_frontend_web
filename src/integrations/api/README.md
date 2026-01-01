# NestJS API Integration

This folder contains the integration with the NestJS backend API.

## Structure

- `client.ts`: The main API client with methods for interacting with all endpoints
- `types.ts`: TypeScript type definitions for the data models

## Usage

Import the API client in your components:

```typescript
import { api } from '@/integrations/api/client.ts';
```

Then use the appropriate methods to interact with the API:

```typescript
// Examples:
const trips = await api.trips.getAll();
const trip = await api.trips.getById(tripId);
const newTrip = await api.trips.create(tripData);
```

## Authentication

The API client automatically handles authentication by:

1. Storing the JWT token in localStorage after login
2. Including the token in all subsequent requests
3. Providing auth methods for login, register, and logout

```typescript
// Login example
await api.auth.login(email, password);
```

# Task Service Microservice

This is a NestJS microservice that handles task management operations using Prisma as the ORM.

## Features

- CRUD operations for tasks
- Prisma integration with PostgreSQL
- TCP-based microservice communication
- Type-safe DTOs

## Message Patterns

The microservice responds to the following message patterns:

- `task.findAll` - Get all tasks
- `task.findOne` - Get a task by ID
- `task.create` - Create a new task
- `task.update` - Update an existing task
- `task.remove` - Delete a task

## Running the Service

```bash
# Start the microservice
npm run start:dev task-service
```

The service will start on `localhost:3002` using TCP transport.

## Client Usage Example

```typescript
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';

const client = ClientProxyFactory.create({
  transport: Transport.TCP,
  options: {
    host: 'localhost',
    port: 3002,
  },
});

// Get all tasks
const tasks = await client.send('task.findAll', {}).toPromise();

// Create a new task
const newTask = await client.send('task.create', {
  title: 'New Task',
  description: 'Task description',
  priority: 1,
  status: 'PENDING'
}).toPromise();

// Update a task
const updatedTask = await client.send('task.update', {
  id: 1,
  data: {
    title: 'Updated Task',
    status: 'IN_PROGRESS'
  }
}).toPromise();
```

## Environment Variables

Make sure to set the `DATABASE_URL` environment variable for Prisma to connect to your PostgreSQL database.

## Dependencies

- @nestjs/microservices
- @prisma/client
- prisma

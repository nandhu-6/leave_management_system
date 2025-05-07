# Leave Management System - Backend

This is the backend for the Leave Management System, built with Node.js, Express, and TypeORM.

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a PostgreSQL database named `leave_management`

3. Update the database configuration in `src/config/database.js` if needed:
```javascript
const AppDataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres', // Update if needed
    password: 'postgres', // Update if needed
    database: 'leave_management',
    synchronize: true,
    logging: true,
    entities: [Employee, Leave]
});
```

4. Start the server:
```bash
npm run dev
```

The server will start on port 3000 by default.

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register a new employee
- POST `/api/auth/login` - Login

### Employees
- GET `/api/employees/profile` - Get employee profile
- PUT `/api/employees/profile` - Update employee profile
- GET `/api/employees/team` - Get team members (Manager/Director/HR only)
- GET `/api/employees/managers` - Get all managers (Manager/Director/HR only)
- GET `/api/employees` - Get all employees (HR only)
- POST `/api/employees` - Create new employee (HR only)
- PUT `/api/employees/:id` - Update employee (HR only)
- DELETE `/api/employees/:id` - Delete employee (HR only)

### Leaves
- POST `/api/leaves/apply` - Apply for leave
- GET `/api/leaves/my-leaves` - Get my leaves
- GET `/api/leaves/balance` - Get leave balance
- POST `/api/leaves/:id/cancel` - Cancel leave
- GET `/api/leaves/team-leaves` - Get team leaves (Manager/Director/HR only)
- GET `/api/leaves/pending-approvals` - Get pending approvals (Manager/Director/HR only)
- POST `/api/leaves/:id/approve` - Approve leave (Manager/Director/HR only)
- POST `/api/leaves/:id/reject` - Reject leave (Manager/Director/HR only)
- POST `/api/leaves/:id/forward` - Forward leave (Manager/Director/HR only)
- GET `/api/leaves/all` - Get all leaves (HR only)
- GET `/api/leaves/status/:id` - Get leave status (HR only)

## Authentication

All endpoints except `/api/auth/register` and `/api/auth/login` require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Error Handling

The API returns appropriate HTTP status codes and error messages in case of errors:

- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error 
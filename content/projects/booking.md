---
title: "Booking System API"
description: "A robust RESTful API for managing bookings and reservations built with TypeScript, Express, and MongoDB."
date: "2023-11-15"
tags: ["personal", "backend", "typescript", "api"]
featured: true
github: "https://github.com/basit-devBE/A-Booking-System-API"
---

# Booking System API

A comprehensive backend solution for managing bookings and reservations with a focus on security, scalability, and developer experience.

## Architecture Highlights

This API implements a clean, modular architecture with:

- **TypeScript** for type safety and improved developer experience
- **Express.js** for robust HTTP request handling
- **JWT Authentication** for secure user sessions
- **MongoDB** for flexible data storage
- **Middleware Pipeline** for request validation and error handling

## Key Features

### Authentication & Authorization
- Secure JWT-based authentication flow
- Role-based access control (Admin, User)
- Token refresh mechanism to maintain sessions

### Booking Management
- Create, read, update, and delete bookings
- Availability checking to prevent double-bookings
- Filtering and pagination for booking queries
- Status tracking (pending, confirmed, completed, cancelled)

### User Management
- User registration and profile management
- Admin dashboard for user oversight
- Activity logging for audit trails

## Technical Implementation

The codebase follows best practices including:

```typescript
// Example booking controller with validation
export const createBooking = async (req: Request, res: Response) => {
  try {
    const { userId, resourceId, startTime, endTime } = req.body;
    
    // Check for availability
    const isAvailable = await checkAvailability(resourceId, startTime, endTime);
    if (!isAvailable) {
      return res.status(409).json({ 
        success: false, 
        message: "Resource not available for requested time slot" 
      });
    }
    
    // Create booking
    const newBooking = await Booking.create({
      userId,
      resourceId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      status: "confirmed"
    });
    
    return res.status(201).json({
      success: true,
      data: newBooking
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create booking",
      error: error.message
    });
  }
};

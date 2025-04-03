---
title: "Service-Repository-Controller (SRC) Pattern in Node.js"
description: "A comprehensive guide to implementing the Service-Repository-Controller pattern in Node.js applications."
date: "2025-04--03"
tags: ["Node.js", "Architecture", "Design Patterns"]
---

# Service-Repository-Controller (SRC) Pattern in Node.js

Ever found yourself drowning in a sea of tangled business logic, database queries, and HTTP handlers all crammed into your controllers? You’re not alone. While the Model-View-Controller (MVC) pattern has been our trusted companion in Node.js development, it often falls short as applications grow more complex. 

Enter the Service-Repository-Controller (SRC) pattern — your ticket to cleaner, more maintainable code that will make your future self (and your team) thank you.

In this guide, I’ll show you why the SRC pattern might be the game-changer your Node.js projects have been waiting for, and how it can transform your spaghetti code into a well-organized symphony of responsibilities. Get ready to level up your architecture game!

## The Problem with MVC

As applications grow in complexity, the traditional MVC pattern often starts to show its limitations. Let’s dive into some real-world scenarios where MVC breaks down and explore the common pain points developers face.

### Fat Controllers
In a typical MVC setup, controllers often become bloated with business logic, database queries, and even validation logic. This does not only make the code harder to read but also harder to test and maintain. 

For instance, consider a controller that handles user authentication, profile updates, and password resets. Over time, this controller becomes a monolithic block of code that is difficult to manage.

### Tight Coupling
MVC can lead to tight coupling between the controller and the model. This makes it challenging to change the underlying data storage or business logic without affecting the entire application. For example, if you decide to switch from a SQL database to a NoSQL database, you might find yourself rewriting large portions of your controllers.

### Lack of Reusability
Business logic embedded in controllers is often not reusable across different parts of the application. If you need to perform the same operation in multiple places, you might end up duplicating code, which violates the DRY (Don’t Repeat Yourself) principle.

### Testing Difficulties
Controllers that are tightly coupled with business logic and database queries are harder to unit test. Mocking dependencies becomes a nightmare, and integration tests can be slow and brittle.

### Scalability Issues
As the application grows, the lack of clear separation between different layers of the application can lead to performance bottlenecks. For example, a controller that directly interacts with the database might not scale well under heavy load.

### Code Example Showing Problematic MVC Implementation
```javascript
// controllers/userController.js
const User = require('../models/User');

exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        user.name = req.body.name;
        user.email = req.body.email;
        await user.save();
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
```

## Understanding the SRC Pattern
The Service-Repository-Controller (SRC) pattern is a modern architectural approach that builds on the foundations of MVC but introduces a clearer separation of concerns. Let’s break down each layer’s responsibility and how they interact.

### 1. Controller: Request/Response Handling
The Controller layer is the entry point of your application. Its sole responsibility is to handle incoming HTTP requests, validate input, and send back appropriate responses. It should be thin and delegate all business logic to the Service layer.

#### Responsibilities:
- Parse and validate request data (e.g., query parameters, request body).
- Call the appropriate service methods.
- Handle errors and send HTTP responses.

#### Example:
```javascript
// controllers/userController.js
const userService = require('../services/userService');

exports.getUser = async (req, res) => {
    try {
        const user = await userService.getUserById(req.params.id);
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
```

### 2. Service: Business Logic Orchestration
The Service layer is where the core business logic resides. It acts as the brain of your application, orchestrating data processing, applying business rules, and interacting with the Repository layer to fetch or persist data.

#### Responsibilities:
- Implement business logic (e.g., calculations, validations, workflows).
- Call the repository layer to access or modify data.
- Handle transactions or complex operations involving multiple repositories.

#### Example:
```javascript
// services/userService.js
const userRepository = require('../repositories/userRepository');

exports.getUserById = async (id) => {
    const user = await userRepository.findById(id);
    if (!user) {
        throw new Error('User not found');
    }
    return user;
};
```

### 3. Repository: Data Access Abstraction
The Repository layer abstracts the data access logic, providing a clean API for the service layer to interact with the database or any other data source.

#### Responsibilities:
- Perform CRUD (Create, Read, Update, Delete) operations.
- Handle database-specific logic (e.g., queries, connections).
- Provide a consistent interface for data access.

#### Example:
```javascript
// repositories/userRepository.js
const User = require('../models/User');

exports.findById = async (id) => {
    return await User.findById(id);
};
```

## Flow Diagram: How They Interact
```
HTTP Request → Controller → Service → Repository → Database
HTTP Response ← Controller ← Service ← Repository ← Database
```

## Benefits and Trade-offs
### Benefits
- **Testing Advantages**: Easier unit testing with clear separation of concerns.
- **Maintainability Improvements**: Easier to navigate and modify.
- **Performance Considerations**: Decoupled data access logic allows optimizations.

### Trade-offs
- **When to Use**: Medium to large applications with complex business logic.
- **When Not to Use**: Small applications or MVPs where speed is more important.

## Conclusion
The SRC pattern is a powerful alternative to traditional MVC, offering a cleaner and more scalable way to structure your Node.js applications. By separating concerns into distinct layers, you can achieve better testability, maintainability, and performance. While it may introduce some overhead for smaller projects, the benefits far outweigh the trade-offs as your application grows in complexity.


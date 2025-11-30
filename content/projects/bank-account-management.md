---
title: "Bank Account Management System"
description: "A console-based banking system exploring the concepts of OOP and separation of concerns."
date: "2025-11-30"
tags: ["Java", "OOP", "Software Architecture"]
github: "https://github.com/basit-devBE/Bank-Account-Management-System"
---

# Bank Account Management System

I wrote a console-based banking application to understand OOP principles and separation of concerns at a practical level. The system handles account creation, transaction processing, and role-based access control using a layered architecture that separates models, controllers, and repositories.

Having come from an [SRC Architecture pattern](blog/SRC), I knew to separate application concerns even though this was a small console application.

## What it does

The application supports:

- Account creation for Savings and Checking accounts
- Customer types with different privileges (Regular vs Premium)
- Transaction processing with deposit and withdrawal operations
- Role-based access (Customer vs Manager)
- Transaction confirmation flow with preview
- Account viewing with proper authorization
- Dynamic array management with auto-resizing

Key features:

- Premium customers pay $10,000 upfront but get no minimum balance requirements, no monthly fees, and higher transaction limits ($50,000 vs $10,000)
- Savings accounts enforce a $500 minimum balance for regular customers and apply 3.5% annual interest
- Checking accounts allow $1,000 overdraft and charge $10 monthly fees (waived for premium)
- Managers can view all accounts and transactions; customers can only see their own
- Every transaction shows a confirmation preview before execution

## Architecture

The system uses a three-layer architecture adapted from MVC for console applications:

## Architecture

The system uses a three-layer architecture adapted from MVC for console applications:

### Models layer (com/bank/models/)

Represents domain entities and business logic. Models define data structure, encapsulate business rules, and implement core operations. They contain no knowledge of storage or presentation.

Key models:

- `Account.java` - Abstract base class with common properties and operations
- `SavingsAccount.java` / `CheckingAccount.java` - Concrete implementations with specific rules
- `Customer.java` - Customer and manager entities with role-based attributes
- `Transaction.java` - Transaction records with status tracking

Business logic example from SavingsAccount:

```java
@Override
public void withdraw(double amount) {
    double currentBalance = checkBalance();
    
    if (getAccountHolder().getCustomerType() == CustomerType.PREMIUM) {
        super.withdraw(amount);
    } else {
        if ((currentBalance - amount) >= MIN_BALANCE) {
            super.withdraw(amount);
        } else {
            System.out.println("Cannot withdraw: Would fall below minimum balance");
        }
    }
}
```

### Controllers layer (com/bank/controllers/)

Handles user interaction and application flow. Controllers receive input, validate data, coordinate between repositories and models, and format output. They do not contain business logic.

Key controllers:

- `MenuController.java` - Main application flow and navigation
- `AccountController.java` - Account creation and viewing workflows
- `TransactionController.java` - Transaction processing workflows

Controller coordination example:

```java
public void createAccount() {
    // Get user input
    System.out.print("Enter initial deposit: ");
    double deposit = scanner.nextDouble();
    
    // Create model (business logic here)
    SavingsAccount account = new SavingsAccount(accountNumber, customer, deposit);
    
    // Delegate storage to repository
    accountManager.addAccount(account);
    
    // Display result
    System.out.println(account.getCreationMessage());
}
```

### Repository layer (com/bank/repository/)

Manages data storage and retrieval. Repositories abstract storage implementation, provide CRUD operations, and handle data access logic. They do not contain business logic.

Key repositories:

- `AccountManager.java` - Stores and retrieves accounts
- `CustomerManager.java` - Manages customer records
- `TransactionManager.java` - Maintains transaction history

Repository storage example:

```java
public void addAccount(Account account) {
    if (accountCount >= accounts.length) {
        resizeArray(); // Infrastructure concern
    }
    accounts[accountCount++] = account; // Storage operation
}
```

## Why this separation matters

Each layer has one responsibility:

- **Models** handle business logic and domain rules
- **Controllers** handle user interaction and flow control
- **Repositories** handle data storage and retrieval

Benefits:

- Changing storage (arrays to database) only affects repositories
- Changing business rules only affects models
- Changing UI (console to GUI) only affects controllers
- Testing business logic independently of UI or storage
- Adding features without scattered changes across the codebase

## OOP principles applied

### Abstraction

`Account` is abstract because there is no generic account in real banking. You have savings accounts or checking accounts, never just an account. The abstract class forces all concrete implementations to define their own withdrawal logic.

### Inheritance

Both `SavingsAccount` and `CheckingAccount` extend `Account`. They inherit common properties like account number, balance, and customer, but each implements its own rules.

### Polymorphism

Runtime behavior selection based on object type:

```java
Account account = accountManager.findAccount(accountNumber);
account.withdraw(500); // Which withdraw() runs?
```

The JVM determines at runtime whether to call `SavingsAccount.withdraw()` or `CheckingAccount.withdraw()`. Same method call, different behavior.

### Encapsulation

All fields are private. You cannot directly modify an account's balance. You must use `deposit()` and `withdraw()`, which enforce business rules.

```java
private double balance; // Cannot access directly

public void deposit(double amount) {
    if (amount > 0) {
        balance += amount; // Controlled access
    }
}
```

## Implementation details

### Static vs instance variables

Early on I initialized arrays inside methods. Every method call created a new array, wiping all stored data. The fix was understanding object lifecycle:

```java
// Wrong
public void addAccount(Account account) {
    Account[] accounts = new Account[50]; // New array every call
    // ...
}

// Correct
public class AccountManager {
    private Account[] accounts; // Instance variable
    
    public AccountManager() {
        this.accounts = new Account[50]; // Initialize once
    }
}
```

Key insight:

- **Static fields** are shared across all class instances (customer ID counter)
- **Instance fields** are unique to each object but persist across method calls
- Initialize collections in constructors, not in methods

### Dynamic array resizing

Repositories use arrays with automatic capacity doubling:

```java
private void resizeArray() {
    Account[] newAccounts = new Account[accounts.length * 2];
    System.arraycopy(accounts, 0, newAccounts, 0, accounts.length);
    accounts = newAccounts;
}
```

### Transaction confirmation flow

Every transaction displays a preview before execution:

```
TRANSACTION CONFIRMATION
──────────────────────────────────────────────────
  Transaction ID: TXN1733001234567
  Account: C414
  Type: WITHDRAWAL
  Amount: $500.00
  Current Balance: $25,000.00
  New Balance: $24,500.00
  Date: 2025-11-30
──────────────────────────────────────────────────
Confirm Transaction? (Y/N):
```

This preview-confirm pattern prevents accidental operations and improves user experience even in console applications.

### Role-based access control

Simple but effective authorization using ID prefixes:

```java
if (!userId.startsWith("MGR")) {
    System.out.println("✗ Access Denied: Only managers can view all accounts.");
    return;
}
```

Managers get IDs like `MGR00001`, customers get `CUST00001`. Not production-grade security, but demonstrates the authorization concept.

## Challenges

### Volume not persisting data

Initializing arrays inside methods created new instances on every call. All previous data was lost. Fixed by moving array initialization to constructors and using instance variables.

### Transaction ID bug

Originally made `transactionId` static, which caused all transactions to share the same ID. The most recent transaction ID would overwrite previous ones. Fixed by making it an instance variable so each transaction has its own unique ID.

### Separation of validation logic

Business rules belong in models, not controllers. Minimum balance checks go in `SavingsAccount`, not in `AccountController`. This separation makes the code testable and maintainable.

## What I would add next

- Database integration to replace in-memory arrays
- Proper authentication instead of simple ID checks
- Account transfer functionality between accounts
- Unit tests for business logic
- REST API to turn it into a backend service
- Proper auto-incrementing ID generation
- Extract `TransactionStatus` enum into its own file for consistency

## Closing thoughts

This project covers the fundamentals: inheritance, polymorphism, encapsulation, abstraction, and architectural patterns. The layered approach makes the code maintainable and testable. The business logic is isolated in models, the UI flow is handled in controllers, and the storage is abstracted in repositories.

If you are learning OOP, build something like this. Make the mistakes. Debug the issues. Understanding comes from implementation, not from reading about principles.
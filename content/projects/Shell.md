---
title: "Simple Shell"
description: "A custom UNIX command interpreter implemented in C, recreating core shell functionality from scratch."
date: "2021-04-15"
tags: ["tool", "c", "systems-programming", "unix"]
github: "https://github.com/basit-devBE/simple_shell"
---
# Simple Shell

A lightweight UNIX command line interpreter written in C, implementing essential shell functionality from the ground up. This project demonstrates low-level systems programming concepts by recreating a fundamental tool that developers use every day.

## Core Features

- **Command Execution**: Executes both built-in commands and external programs
- **Environment Management**: Handles environment variables through custom implementation
- **Directory Navigation**: Built-in `cd` command with proper path handling
- **Command History**: Tracks previously executed commands
- **Signal Handling**: Properly responds to keyboard interrupts (Ctrl+C)
- **Variable Substitution**: Processes special variables like `$?` and `$$`
- **Memory Management**: Careful allocation and freeing to prevent leaks

## Technical Implementation

### Architecture

The shell follows a modular design with components handling specific functions:

```
Main Flow:
+---------------+      +------------------+      +----------------+
| Input Parser  |----->| Command Executor |----->| Output Handler |
+---------------+      +------------------+      +----------------+
       |                       |                        |
       |                       |                        |
       v                       v                        v
+---------------+      +------------------+      +----------------+
| Token Manager |      | Environment Mgr  |      | Error Handler  |
+---------------+      +------------------+      +----------------+
```

### Key Components

#### Parser and Tokenizer
The shell parses user input, breaking commands into tokens while handling special cases like quoted strings and escape characters. The tokenizer splits command lines into individual arguments using delimiters while properly managing memory allocation.

#### Command Execution
The execution engine determines whether commands are built-in shell functions or external programs. Built-ins are handled internally, while external commands are executed using process creation and management functions.

#### Environment Management
Custom implementation for handling environment variables, including retrieving, setting, and unsetting them. This component maintains the shell's environment context.

#### Path Resolution
Locates executable files by searching through the directories specified in the PATH environment variable, implementing proper executable discovery logic.

#### Error Handling
Comprehensive error detection and reporting system that provides meaningful feedback to users when operations fail.
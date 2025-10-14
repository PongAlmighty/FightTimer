# Project Rules

## IMPORTANT
- Always read the steering documents before making any changes to the codebase.

## Core Development Principles

### Simplicity First
Always prefer simple solutions over complex ones. If a simple JSON file can do the job, don't use a database.

### DRY Principle
Avoid duplication of code. Check other areas of the codebase that might already have similar functionality.

### Wait for the User
Anytime that you're about to either commit code to github, rebuild any docker environments, or push code to the remote repository, wait for the User to confirm that it is safe to do so.

### Readability
Write code that is self-explanatory and easy to understand.

### Focused Changes
Only make changes that are requested or you are confident are well understood and related to the task at hand.

### Respect Existing Patterns
When fixing issues, exhaust all options within the existing implementation before introducing new patterns or technologies.

### Clean Code
Keep the codebase clean and organized.

### Avoid One-off Scripts
Don't create script files for operations that will only be run once.

### Real Data Only
Never use mocking or stubbed data.

### Configuration Safety
Never overwrite .env files without explicit confirmation.

## Data Storage Guidelines

- Use the simplest storage solution appropriate for the task
- For simple lists and local applications, prefer JSON files over databases
- Only use databases when truly necessary (high volume, complex queries, etc.)
- Implement proper error handling for file operations
- Consider file locking for concurrent access scenarios
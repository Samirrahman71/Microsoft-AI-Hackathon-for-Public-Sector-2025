# Contributing to Azure Hack Frontend

Thank you for your interest in contributing to the Azure Hack Frontend project! This document provides guidelines and instructions for contributing to this repository.

## Getting Started

1. **Fork the repository**
2. **Clone your fork:**
   ```
   git clone https://github.com/YOUR-USERNAME/azurehack.git
   ```
3. **Create a branch:**
   ```
   git checkout -b feature/your-feature-name
   ```

## Development Environment Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Copy `.env.example` to `.env` and add your API keys:
   ```
   cp .env.example .env
   ```

3. Start the development server:
   ```
   npm start
   ```

## Code Style

- Follow the existing code style in the repository
- Use meaningful variable and function names
- Include comments for complex logic

## Pull Request Process

1. Update the README.md if needed with details of changes
2. Update the CHANGELOG.md with details of changes
3. Your PR should include:
   - A clear title and description
   - Reference to the issue it resolves (if applicable)
   - Screenshots or GIFs for UI changes

## Frontend Architecture

The frontend is built with React and uses:

- React Router for navigation
- Styled Components for styling
- OpenAI API integration via the CAGHandler service

## Branch Naming Convention

- `feature/`: For new features
- `bugfix/`: For bug fixes
- `docs/`: For documentation changes
- `refactor/`: For code refactoring with no functional changes

Thank you for contributing!

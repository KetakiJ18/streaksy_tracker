# Contributing Guide

## Development Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (see README.md)

4. Start PostgreSQL (using Docker):
```bash
npm run docker:up
```

5. Run database migrations:
```bash
cd backend && npm run migrate
```

6. Start development servers:
```bash
npm run dev
```

## Code Style

- Use TypeScript for type safety
- Follow ESLint rules
- Use Prettier for formatting
- Write meaningful commit messages

## Testing

- Write tests for new features
- Run tests before committing:
```bash
npm test
```

- Maintain test coverage above 80%

## Pull Request Process

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Ensure all tests pass
5. Update documentation if needed
6. Submit pull request with description

## Project Structure

```
tracker/
├── backend/          # Express API
│   ├── src/
│   │   ├── routes/   # API routes
│   │   ├── services/ # Business logic
│   │   ├── middleware/
│   │   └── utils/
│   └── __tests__/    # Tests
├── frontend/         # React app
│   ├── src/
│   │   ├── pages/    # Page components
│   │   ├── components/
│   │   ├── store/    # State management
│   │   └── services/
│   └── tests/        # Tests
└── tests/           # E2E tests
```

## Commit Message Format

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `test:` Tests
- `refactor:` Code refactoring
- `style:` Formatting
- `chore:` Maintenance


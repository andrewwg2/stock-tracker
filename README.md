# Stock Tracker

A comprehensive React TypeScript application for tracking stock trades and portfolio performance. This application provides a clean, consistent codebase with modern development patterns and best practices.

## Features

- **Trade Tracking**: Add, edit, and manage stock trades
- **Portfolio Analytics**: View gains/losses, win rates, and performance metrics
- **Data Visualization**: Interactive charts showing portfolio performance over time
- **Real-time Prices**: Fetch current stock prices (with API fallbacks)
- **Local Storage**: Persistent data storage in browser
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Accessibility**: WCAG compliant with proper ARIA labels and keyboard navigation
- **Test Coverage**: Comprehensive unit tests with Vitest

## Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **State Management**: Zustand for global state
- **Charts**: Recharts for data visualization
- **Build Tool**: Vite for fast development and optimized builds
- **Testing**: Vitest + React Testing Library
- **Code Quality**: ESLint with TypeScript rules
- **API Integration**: Alpha Vantage API (with fallback mock data)

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Optional: Alpha Vantage API key for real stock prices

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd stock-tracker
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Set up environment variables:
```bash
cp .env.example .env
```
Add your Alpha Vantage API key to the `.env` file:
```env
VITE_ALPHA_VANTAGE_API_KEY=your_api_key_here
```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Testing

Run the test suite:
```bash
npm test
```

Run tests with UI:
```bash
npm run test:ui
```

### Building

Build for production:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components (Button, Input, Card, etc.)
│   └── features/       # Feature-specific components (TradeForm, TradesList, etc.)
├── hooks/              # Custom React hooks
├── services/           # Business logic and API services
├── store/              # Zustand store configuration
├── utils/              # Utility functions and helpers
├── types/              # TypeScript type definitions
├── dto/                # Data Transfer Objects
├── mappers/            # Data mapping between layers
└── test/               # Test configuration and utilities
```

## Code Architecture

### Consistent Patterns

This project follows consistent architectural patterns:

1. **Layered Architecture**: Clear separation between UI, business logic, and data layers
2. **Type Safety**: Comprehensive TypeScript coverage with proper interfaces
3. **Error Handling**: Consistent error boundaries and user feedback
4. **State Management**: Centralized state with Zustand
5. **Testing**: Component and unit tests with good coverage

### Key Design Decisions

- **Component Composition**: Reusable UI components with consistent props
- **Custom Hooks**: Encapsulated state logic and side effects
- **Service Layer**: Separated business logic from React components
- **DTO Pattern**: Clean data transfer between layers
- **Mapper Classes**: Transform data between different representations

## API Integration

The app uses the Alpha Vantage API for stock prices with graceful fallbacks:

1. **Real Data**: When API key is configured
2. **Cached Data**: Recent prices stored in localStorage
3. **Mock Data**: Fallback for development and demo purposes

To get an API key:
1. Visit [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
2. Sign up for a free account
3. Add your API key to the `.env` file

## Customization

### Styling

The application uses Tailwind CSS with a custom design system:
- Consistent color palette in `src/utils/constants.ts`
- Reusable component classes in `src/App.css`
- Responsive breakpoints and mobile-first approach

### Adding Features

1. Create new components in `src/components/`
2. Add business logic in `src/services/`
3. Define types in `src/types/`
4. Create corresponding tests
5. Export from appropriate `index.ts` files

### Configuration

Key configuration files:
- `src/utils/constants.ts` - Application constants and feature flags
- `vite.config.ts` - Build configuration
- `tailwind.config.js` - Styling configuration
- `vitest.config.ts` - Test configuration

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers with ES2022 support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes following the established patterns
4. Add tests for new functionality
5. Run `npm run lint` and `npm test`
6. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- React and TypeScript teams for excellent tooling
- Recharts for beautiful chart components
- Alpha Vantage for stock market data API
- Tailwind CSS for utility-first styling

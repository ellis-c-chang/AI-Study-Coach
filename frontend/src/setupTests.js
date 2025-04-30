// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { server } from './mocks/server';

// Enable API mocking before all tests
beforeAll(() => server.listen());

// Reset handlers between tests
afterEach(() => server.resetHandlers());

// Clean up after all tests
afterAll(() => server.close());

// Mock localStorage
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock for window.alert
window.alert = jest.fn();

// Mock for window.speechSynthesis (for text-to-speech in Chatbot)
window.speechSynthesis = {
  speak: jest.fn()
};

// Mock for webkitSpeechRecognition
window.webkitSpeechRecognition = jest.fn().mockImplementation(() => {
  return {
    start: jest.fn(),
    stop: jest.fn(),
    onresult: jest.fn(),
    onerror: jest.fn(),
    onend: jest.fn()
  };
});

// Mock for FullCalendar
jest.mock('@fullcalendar/react', () => {
  return {
    __esModule: true,
    default: jest.fn(() => <div data-testid="fullcalendar-mock">FullCalendar Mock</div>)
  };
});

// Mock for recharts charts
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }) => <div>{children}</div>,
    LineChart: () => <div data-testid="line-chart-mock">LineChart Mock</div>,
    BarChart: () => <div data-testid="bar-chart-mock">BarChart Mock</div>,
    PieChart: () => <div data-testid="pie-chart-mock">PieChart Mock</div>,
    Line: () => <div>Line Mock</div>,
    Bar: () => <div>Bar Mock</div>,
    Pie: () => <div>Pie Mock</div>,
    XAxis: () => <div>XAxis Mock</div>,
    YAxis: () => <div>YAxis Mock</div>,
    CartesianGrid: () => <div>CartesianGrid Mock</div>,
    Tooltip: () => <div>Tooltip Mock</div>,
    Legend: () => <div>Legend Mock</div>
  };
});

// Mock for react-dnd
jest.mock('react-dnd', () => ({
  useDrag: () => [{ isDragging: false }, jest.fn()],
  useDrop: () => [{ isOver: false }, jest.fn()],
  DndProvider: ({ children }) => <div>{children}</div>
}));

jest.mock('react-dnd-html5-backend', () => ({
  HTML5Backend: {}
}));
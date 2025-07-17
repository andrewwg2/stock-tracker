
import TradeList from "./components/TradeList";

function App() {
  return (
  <div className="min-h-screen bg-neutral-200 flex items-center justify-center px-4">
      <div className="bg-slate-100 rounded-2xl shadow-lg p-8 w-full max-w-2xl border border-neutral-300">
        <h1 className="text-3xl font-bold mb-4 text-center">Simulated Stock Tracker</h1>
        <TradeList />
      </div>
    </div>
  );
}

export default App;
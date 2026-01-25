
import React, { useState, useEffect, useCallback, useRef } from 'react';

interface CalculatorProps {
  onClose: () => void;
}

const Calculator: React.FC<CalculatorProps> = ({ onClose }) => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [resetOnNext, setResetOnNext] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [memory, setMemory] = useState<number>(0);
  const [showHistory, setShowHistory] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const performCalculation = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b !== 0 ? a / b : 0;
      default: return b;
    }
  };

  const handleDigit = useCallback((digit: string) => {
    setDisplay(prev => {
      if (prev === '0' || resetOnNext) {
        setResetOnNext(false);
        return digit === '.' ? '0.' : digit;
      }
      if (digit === '.' && prev.includes('.')) return prev;
      if (prev.length < 15) return prev + digit;
      return prev;
    });
  }, [resetOnNext]);

  const handleOperator = useCallback((op: string) => {
    const current = parseFloat(display);
    if (prevValue !== null && operation && !resetOnNext) {
      const result = performCalculation(prevValue, current, operation);
      setPrevValue(result);
      setDisplay(result.toString());
    } else {
      setPrevValue(current);
    }
    setOperation(op);
    setEquation(`${current} ${op}`);
    setResetOnNext(true);
  }, [display, prevValue, operation, resetOnNext]);

  const calculate = useCallback(() => {
    if (prevValue === null || operation === null) return;
    const current = parseFloat(display);
    const result = performCalculation(prevValue, current, operation);
    
    const newHistoryItem = `${prevValue} ${operation} ${current} = ${result}`;
    setHistory(prev => [newHistoryItem, ...prev].slice(0, 10));
    
    setDisplay(result.toString());
    setEquation('');
    setPrevValue(null);
    setOperation(null);
    setResetOnNext(true);
  }, [display, prevValue, operation]);

  const clear = useCallback(() => {
    setDisplay('0');
    setEquation('');
    setPrevValue(null);
    setOperation(null);
    setResetOnNext(false);
  }, []);

  const backspace = useCallback(() => {
    setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
  }, []);

  const handleScientific = useCallback((type: string) => {
    const current = parseFloat(display);
    let result = current;
    switch (type) {
      case 'sq': result = current * current; break;
      case 'sqrt': result = Math.sqrt(current); break;
      case 'percent': result = current / 100; break;
      case 'negate': result = -current; break;
    }
    setDisplay(result.toString());
    setResetOnNext(true);
  }, [display]);

  const handleMemory = useCallback((type: string) => {
    const current = parseFloat(display);
    switch (type) {
      case 'MC': setMemory(0); break;
      case 'MR': setDisplay(memory.toString()); setResetOnNext(true); break;
      case 'M+': setMemory(m => m + current); break;
      case 'M-': setMemory(m => m - current); break;
    }
  }, [display, memory]);

  // Keyboard support with Enter to Equal mapping
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      
      // Visual feedback
      setActiveKey(key);
      setTimeout(() => setActiveKey(null), 100);

      if (key >= '0' && key <= '9') {
        handleDigit(key);
      } else if (key === '.') {
        handleDigit('.');
      } else if (key === '+') {
        handleOperator('+');
      } else if (key === '-') {
        handleOperator('-');
      } else if (key === '*') {
        handleOperator('*');
      } else if (key === '/') {
        e.preventDefault();
        handleOperator('/');
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        calculate();
      } else if (key === 'Escape') {
        clear();
      } else if (key === 'Backspace') {
        backspace();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleOperator, calculate, clear, backspace]);

  return (
    <div className="absolute top-10 right-10 w-80 bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 z-100 overflow-hidden animate-in fade-in slide-in-from-top-4 flex flex-col ring-1 ring-white/10">
      {/* Title Bar */}
      <div className="bg-[#5a1f2d] p-3 flex justify-between items-center text-white text-[10px] font-black uppercase tracking-widest border-b border-[#3d1420]">
        <div className="flex items-center space-x-2">
          <i className="fas fa-calculator text-red-400"></i>
          <span>ERP Advanced Calc</span>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className={`transition-all p-1.5 rounded-md ${showHistory ? 'text-red-300 bg-white/10 shadow-inner' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            title="Calculation History"
          >
            <i className="fas fa-history"></i>
          </button>
          <button onClick={onClose} className="text-slate-400 hover:text-red-400 transition-colors p-1.5 hover:bg-red-400/10 rounded-md">
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>

      {/* Screen Area */}
      <div className="p-5 bg-slate-950 flex flex-col justify-end items-end h-36 border-b border-slate-800 shadow-inner">
        <div className="text-[11px] font-mono text-red-500/60 h-5 mb-1 uppercase tracking-widest overflow-hidden">
          {equation || (prevValue !== null ? `${prevValue} ${operation}` : '')}
        </div>
        <div className="text-5xl font-mono text-red-400 overflow-hidden truncate max-w-full tracking-tighter transition-all duration-150">
          {parseFloat(display).toLocaleString(undefined, { maximumFractionDigits: 8 })}
        </div>
      </div>

      {/* Expandable History Area */}
      {showHistory && (
        <div className="bg-slate-800 p-4 border-b border-slate-700 animate-in slide-in-from-top duration-300 max-h-40 overflow-y-auto custom-scrollbar shadow-inner">
          <p className="text-[9px] font-black text-slate-500 uppercase mb-3 tracking-[2px]">Audit Trail / History</p>
          <div className="space-y-2">
            {history.map((h, i) => (
              <div key={i} className="text-[10px] font-mono text-red-300/80 bg-slate-900/60 p-2 rounded-lg border border-slate-700/50 flex justify-between items-center group cursor-pointer hover:bg-slate-900 transition-colors"
                onClick={() => {
                  const result = h.split('=')[1].trim();
                  setDisplay(result);
                  setResetOnNext(true);
                }}
              >
                <span>{h.split('=')[0]}</span>
                <span className="font-black text-red-400">= {h.split('=')[1]}</span>
              </div>
            ))}
            {history.length === 0 && <p className="text-[10px] text-slate-600 italic text-center py-2">History is empty</p>}
          </div>
        </div>
      )}

      {/* Keyboard Grid */}
      <div className="p-4 grid grid-cols-4 gap-2 bg-slate-900">
        {/* Memory Row */}
        <div className="col-span-4 grid grid-cols-4 gap-2 mb-1">
          {['MC', 'MR', 'M+', 'M-'].map(m => (
            <button key={m} onClick={() => handleMemory(m)} className="py-2.5 bg-slate-800/50 text-slate-500 text-[10px] font-black rounded-lg hover:bg-slate-700 hover:text-white transition-all uppercase tracking-widest border border-slate-700/50 active:scale-95">
              {m}
            </button>
          ))}
        </div>

        {/* Scientific Row */}
        <button onClick={() => handleScientific('percent')} className="py-3.5 bg-slate-800 text-slate-300 text-xs font-black rounded-xl hover:bg-slate-700 transition-all border border-slate-700/30 active:scale-95 shadow-sm">%</button>
        <button onClick={clear} className="py-3.5 bg-red-900/20 text-red-400 text-xs font-black rounded-xl hover:bg-red-900/40 transition-all border border-red-900/20 active:scale-95">C</button>
        <button onClick={backspace} className="py-3.5 bg-slate-800 text-slate-300 text-xs font-black rounded-xl hover:bg-slate-700 transition-all border border-slate-700/30 active:scale-95"><i className="fas fa-backspace"></i></button>
        <button onClick={() => handleOperator('/')} className={`py-3.5 rounded-xl font-black text-sm transition-all shadow-lg active:scale-95 ${activeKey === '/' || operation === '/' ? 'bg-red-600 text-white' : 'bg-[#7d2b3f] text-red-100 hover:bg-[#5a1f2d]'}`}>÷</button>

        {/* Digit Grid */}
        <button onClick={() => handleDigit('7')} className={`py-5 bg-slate-800 text-white font-black text-lg rounded-xl transition-all border border-slate-700/30 active:scale-95 ${activeKey === '7' ? 'bg-slate-600 scale-95' : 'hover:bg-slate-700'}`}>7</button>
        <button onClick={() => handleDigit('8')} className={`py-5 bg-slate-800 text-white font-black text-lg rounded-xl transition-all border border-slate-700/30 active:scale-95 ${activeKey === '8' ? 'bg-slate-600 scale-95' : 'hover:bg-slate-700'}`}>8</button>
        <button onClick={() => handleDigit('9')} className={`py-5 bg-slate-800 text-white font-black text-lg rounded-xl transition-all border border-slate-700/30 active:scale-95 ${activeKey === '9' ? 'bg-slate-600 scale-95' : 'hover:bg-slate-700'}`}>9</button>
        <button onClick={() => handleOperator('*')} className={`py-5 rounded-xl font-black text-lg transition-all shadow-lg active:scale-95 ${activeKey === '*' || operation === '*' ? 'bg-red-600 text-white' : 'bg-[#7d2b3f] text-red-100 hover:bg-[#5a1f2d]'}`}>×</button>

        <button onClick={() => handleDigit('4')} className={`py-5 bg-slate-800 text-white font-black text-lg rounded-xl transition-all border border-slate-700/30 active:scale-95 ${activeKey === '4' ? 'bg-slate-600 scale-95' : 'hover:bg-slate-700'}`}>4</button>
        <button onClick={() => handleDigit('5')} className={`py-5 bg-slate-800 text-white font-black text-lg rounded-xl transition-all border border-slate-700/30 active:scale-95 ${activeKey === '5' ? 'bg-slate-600 scale-95' : 'hover:bg-slate-700'}`}>5</button>
        <button onClick={() => handleDigit('6')} className={`py-5 bg-slate-800 text-white font-black text-lg rounded-xl transition-all border border-slate-700/30 active:scale-95 ${activeKey === '6' ? 'bg-slate-600 scale-95' : 'hover:bg-slate-700'}`}>6</button>
        <button onClick={() => handleOperator('-')} className={`py-5 rounded-xl font-black text-xl transition-all shadow-lg active:scale-95 ${activeKey === '-' || operation === '-' ? 'bg-red-600 text-white' : 'bg-[#7d2b3f] text-red-100 hover:bg-[#5a1f2d]'}`}>−</button>

        <button onClick={() => handleDigit('1')} className={`py-5 bg-slate-800 text-white font-black text-lg rounded-xl transition-all border border-slate-700/30 active:scale-95 ${activeKey === '1' ? 'bg-slate-600 scale-95' : 'hover:bg-slate-700'}`}>1</button>
        <button onClick={() => handleDigit('2')} className={`py-5 bg-slate-800 text-white font-black text-lg rounded-xl transition-all border border-slate-700/30 active:scale-95 ${activeKey === '2' ? 'bg-slate-600 scale-95' : 'hover:bg-slate-700'}`}>2</button>
        <button onClick={() => handleDigit('3')} className={`py-5 bg-slate-800 text-white font-black text-lg rounded-xl transition-all border border-slate-700/30 active:scale-95 ${activeKey === '3' ? 'bg-slate-600 scale-95' : 'hover:bg-slate-700'}`}>3</button>
        <button onClick={() => handleOperator('+')} className={`py-5 rounded-xl font-black text-xl transition-all shadow-lg active:scale-95 ${activeKey === '+' || operation === '+' ? 'bg-red-600 text-white' : 'bg-[#7d2b3f] text-red-100 hover:bg-[#5a1f2d]'}`}>+</button>

        <button onClick={() => handleScientific('negate')} className="py-5 bg-slate-800 text-white font-black text-lg rounded-xl hover:bg-slate-700 transition-all border border-slate-700/30 active:scale-95">±</button>
        <button onClick={() => handleDigit('0')} className={`py-5 bg-slate-800 text-white font-black text-lg rounded-xl transition-all border border-slate-700/30 active:scale-95 ${activeKey === '0' ? 'bg-slate-600 scale-95' : 'hover:bg-slate-700'}`}>0</button>
        <button onClick={() => handleDigit('.')} className={`py-5 bg-slate-800 text-white font-black text-lg rounded-xl transition-all border border-slate-700/30 active:scale-95 ${activeKey === '.' ? 'bg-slate-600 scale-95' : 'hover:bg-slate-700'}`}>.</button>
        <button onClick={calculate} className={`py-5 bg-green-600 text-white font-black text-xl rounded-xl transition-all shadow-xl shadow-green-900/40 active:scale-90 hover:bg-green-500 border border-green-500/30 ${activeKey === 'Enter' || activeKey === '=' ? 'scale-90 bg-green-400' : ''}`}>=</button>
      </div>

      {/* Keyboard Hint */}
      <div className="bg-slate-950 p-2 text-center border-t border-slate-800">
        <p className="text-[8px] font-black text-slate-600 uppercase tracking-[3px]">Keyboard Shortcuts Enabled (Enter = Equal)</p>
      </div>
    </div>
  );
};

export default Calculator;

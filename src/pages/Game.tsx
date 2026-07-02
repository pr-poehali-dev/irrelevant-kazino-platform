import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';

/* ─── Типы игр ─── */
const GAMES_META: Record<string, { name: string; cat: string; icon: string; accent: string; desc: string }> = {
  'void-crash':    { name: 'Void Crash',      cat: 'Краш',    icon: 'TrendingUp', accent: 'blue',   desc: 'Успей забрать до краша!' },
  'plazma-slots':  { name: 'Plazma Slots',    cat: 'Слоты',   icon: 'Cherry',     accent: 'purple', desc: '3 символа — твой выигрыш' },
  'neon-roulette': { name: 'Neon Roulette',   cat: 'Рулетка', icon: 'CircleDot',  accent: 'cyan',   desc: 'Угадай цвет или число' },
  'cyber-blackjack': { name: 'Cyber Blackjack', cat: 'Карты', icon: 'Spade',      accent: 'pink',   desc: 'Набери 21 и победи дилера' },
  'quantum-poker': { name: 'Quantum Poker',   cat: 'Карты',   icon: 'Diamond',    accent: 'purple', desc: 'Лучшая рука забирает банк' },
  'aurora-live':   { name: 'Aurora Live',     cat: 'Live',    icon: 'Radio',      accent: 'cyan',   desc: 'Игра в прямом эфире' },
  'hyper-dice':    { name: 'Hyper Dice',      cat: 'Live',    icon: 'Dices',      accent: 'pink',   desc: 'Угадай результат кубиков' },
  'star-fortune':  { name: 'Star Fortune',    cat: 'Слоты',   icon: 'Sparkles',   accent: 'blue',   desc: 'Звёздные символы приносят PZC' },
};

type User = { id: number; username: string; balance: number; is_admin: boolean };

/* ─── Crash Game ─── */
function CrashGame({ user, onBalanceChange }: { user: User; onBalanceChange: (b: number) => void }) {
  const [phase, setPhase] = useState<'waiting' | 'running' | 'crashed'>('waiting');
  const [mult, setMult] = useState(1.0);
  const [bet, setBet] = useState('100');
  const [cashedOut, setCashedOut] = useState<number | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const [msg, setMsg] = useState('');
  const [betPlaced, setBetPlaced] = useState(false);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const crashAt = useRef<number>(1);

  const generateCrash = () => {
    // Честный алгоритм: 50% шанс выше 2x, экспоненциальное распределение
    const r = Math.random();
    if (r < 0.33) return 1 + Math.random() * 0.9;
    if (r < 0.65) return 1.5 + Math.random() * 1.5;
    if (r < 0.85) return 2.5 + Math.random() * 3;
    if (r < 0.95) return 5 + Math.random() * 10;
    return 10 + Math.random() * 40;
  };

  const startRound = useCallback(() => {
    crashAt.current = generateCrash();
    setPhase('running');
    setCashedOut(null);
    setBetPlaced(false);
    setMsg('');
    startRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed = (now - startRef.current) / 1000;
      const current = Math.pow(Math.E, 0.15 * elapsed);
      if (current >= crashAt.current) {
        setMult(+crashAt.current.toFixed(2));
        setPhase('crashed');
        setHistory((h) => [+crashAt.current.toFixed(2), ...h.slice(0, 9)]);
        return;
      }
      setMult(+current.toFixed(2));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    const timer = setTimeout(startRound, 3000);
    return () => clearTimeout(timer);
  }, [startRound]);

  useEffect(() => {
    if (phase === 'crashed') {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (betPlaced && cashedOut === null) {
        setMsg(`Краш! Ты потерял ${bet} PZC`);
      }
      const timer = setTimeout(startRound, 4000);
      return () => clearTimeout(timer);
    }
  }, [phase, betPlaced, cashedOut, bet, startRound]);

  function placeBet() {
    const amount = parseInt(bet);
    if (!amount || amount <= 0) return;
    if (amount > user.balance) { setMsg('Недостаточно PZC'); return; }
    if (phase !== 'running') { setMsg('Дождись начала раунда'); return; }
    if (betPlaced) return;
    onBalanceChange(user.balance - amount);
    setBetPlaced(true);
    setMsg(`Ставка ${amount} PZC принята! Множитель растёт...`);
  }

  function cashOut() {
    if (!betPlaced || cashedOut !== null || phase !== 'running') return;
    const amount = parseInt(bet);
    const win = Math.floor(amount * mult);
    setCashedOut(mult);
    onBalanceChange(user.balance - amount + win);
    setMsg(`Выведено! x${mult} → +${win - amount} PZC`);
  }

  const multColor = mult >= 5 ? 'text-neon-cyan' : mult >= 2 ? 'text-neon-purple' : 'text-foreground';

  return (
    <div className="space-y-6">
      {/* Множитель */}
      <div className="glass rounded-3xl border border-border p-10 text-center relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`w-64 h-64 rounded-full blur-3xl opacity-20 transition-all duration-300 ${
            phase === 'crashed' ? 'bg-destructive' : 'bg-neon-purple'
          }`} />
        </div>
        <div className="relative">
          {phase === 'waiting' && (
            <div className="text-muted-foreground font-display text-2xl animate-pulse-glow">
              Новый раунд через 3 сек...
            </div>
          )}
          {phase === 'running' && (
            <div className={`font-display text-8xl font-bold ${multColor} text-glow-purple transition-colors`}>
              x{mult.toFixed(2)}
            </div>
          )}
          {phase === 'crashed' && (
            <div className="font-display text-8xl font-bold text-destructive">
              x{mult.toFixed(2)}<br />
              <span className="text-2xl">КРАШ!</span>
            </div>
          )}
        </div>

        {/* История */}
        <div className="relative flex gap-2 justify-center mt-6 flex-wrap">
          {history.map((m, i) => (
            <span key={i} className={`text-xs px-2 py-1 rounded-lg font-semibold ${
              m >= 2 ? 'bg-neon-cyan/10 text-neon-cyan' : 'bg-destructive/10 text-destructive'
            }`}>x{m}</span>
          ))}
        </div>
      </div>

      {/* Управление */}
      <div className="glass rounded-2xl border border-border p-6">
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-32">
            <label className="text-xs text-muted-foreground mb-1.5 block">Ставка (PZC)</label>
            <input
              type="number" value={bet} onChange={(e) => setBet(e.target.value)}
              disabled={betPlaced && phase === 'running'}
              className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
            />
          </div>
          <div className="flex gap-2">
            {[50, 100, 500, 1000].map((v) => (
              <button key={v} onClick={() => setBet(String(v))}
                disabled={betPlaced && phase === 'running'}
                className="px-3 py-2.5 text-xs rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-muted-foreground hover:text-foreground">
                {v}
              </button>
            ))}
          </div>
          {!betPlaced ? (
            <Button onClick={placeBet} disabled={phase !== 'running'}
              className="plasma-gradient text-background font-semibold hover:opacity-90 box-glow px-6">
              <Icon name="Play" size={16} className="mr-1" /> Ставить
            </Button>
          ) : (
            <Button onClick={cashOut} disabled={phase !== 'running' || cashedOut !== null}
              className="bg-neon-cyan text-background font-semibold hover:opacity-90 box-glow-cyan px-6">
              <Icon name="HandCoins" size={16} className="mr-1" /> Забрать x{mult.toFixed(2)}
            </Button>
          )}
        </div>
        {msg && (
          <div className={`mt-3 text-sm px-3 py-2 rounded-lg ${
            msg.includes('потерял') ? 'bg-destructive/10 text-destructive'
            : msg.includes('Выведено') ? 'bg-neon-cyan/10 text-neon-cyan'
            : 'bg-secondary text-muted-foreground'
          }`}>
            {msg}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Slots Game ─── */
const SLOT_SYMS = ['🍒', '💎', '⚡', '🌙', '⭐', '🎰', '🔮', '💜'];
const SLOT_PAYS: Record<string, number> = { '🍒': 2, '⭐': 3, '⚡': 4, '🌙': 5, '💎': 10, '🔮': 15, '🎰': 20, '💜': 50 };

function SlotsGame({ user, onBalanceChange }: { user: User; onBalanceChange: (b: number) => void }) {
  const [reels, setReels] = useState(['🎰', '🎰', '🎰']);
  const [spinning, setSpinning] = useState(false);
  const [bet, setBet] = useState('100');
  const [msg, setMsg] = useState('Сделай ставку и крути!');
  const [winAmount, setWinAmount] = useState<number | null>(null);

  function spin() {
    const amount = parseInt(bet);
    if (!amount || amount <= 0 || spinning) return;
    if (amount > user.balance) { setMsg('Недостаточно PZC'); return; }
    onBalanceChange(user.balance - amount);
    setSpinning(true);
    setMsg('Крутим...');
    setWinAmount(null);

    let ticks = 0;
    const iv = setInterval(() => {
      setReels([
        SLOT_SYMS[Math.floor(Math.random() * SLOT_SYMS.length)],
        SLOT_SYMS[Math.floor(Math.random() * SLOT_SYMS.length)],
        SLOT_SYMS[Math.floor(Math.random() * SLOT_SYMS.length)],
      ]);
      ticks++;
      if (ticks >= 20) {
        clearInterval(iv);
        const r1 = SLOT_SYMS[Math.floor(Math.random() * SLOT_SYMS.length)];
        const r2 = SLOT_SYMS[Math.floor(Math.random() * SLOT_SYMS.length)];
        const r3 = SLOT_SYMS[Math.floor(Math.random() * SLOT_SYMS.length)];
        const final = [r1, r2, r3];
        setReels(final);
        setSpinning(false);
        if (r1 === r2 && r2 === r3) {
          const mult = SLOT_PAYS[r1] ?? 2;
          const win = amount * mult;
          onBalanceChange(user.balance - amount + win);
          setWinAmount(win);
          setMsg(`🎉 ДЖЕКПОТ! x${mult} → +${win - amount} PZC`);
        } else if (r1 === r2 || r2 === r3 || r1 === r3) {
          const win = Math.floor(amount * 1.5);
          onBalanceChange(user.balance - amount + win);
          setWinAmount(win);
          setMsg(`Пара! +${win - amount} PZC`);
        } else {
          setMsg(`Не повезло. Попробуй ещё раз!`);
        }
      }
    }, 80);
  }

  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl border border-border p-10 text-center relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="relative flex justify-center gap-4">
          {reels.map((s, i) => (
            <div key={i} className={`w-24 h-24 rounded-2xl bg-secondary border-2 flex items-center justify-center text-5xl transition-all ${
              spinning ? 'border-neon-purple animate-pulse' : winAmount ? 'border-neon-cyan box-glow-cyan' : 'border-border'
            }`}>
              {s}
            </div>
          ))}
        </div>
        <div className={`mt-6 font-display text-lg font-semibold transition-colors ${
          msg.includes('ДЖЕКПОТ') || msg.includes('Пара') ? 'text-neon-cyan' : msg.includes('Не') ? 'text-destructive/70' : 'text-muted-foreground'
        }`}>{msg}</div>
      </div>

      <div className="glass rounded-2xl border border-border p-6">
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-32">
            <label className="text-xs text-muted-foreground mb-1.5 block">Ставка (PZC)</label>
            <input type="number" value={bet} onChange={(e) => setBet(e.target.value)} disabled={spinning}
              className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/60" />
          </div>
          <div className="flex gap-2">
            {[50, 100, 500, 1000].map((v) => (
              <button key={v} onClick={() => setBet(String(v))} disabled={spinning}
                className="px-3 py-2.5 text-xs rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-muted-foreground hover:text-foreground">
                {v}
              </button>
            ))}
          </div>
          <Button onClick={spin} disabled={spinning}
            className="plasma-gradient text-background font-semibold hover:opacity-90 box-glow px-6">
            {spinning ? <Icon name="Loader" size={16} className="animate-spin mr-1" /> : <Icon name="RotateCw" size={16} className="mr-1" />}
            {spinning ? 'Крутим...' : 'Крутить'}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Roulette Game ─── */
function RouletteGame({ user, onBalanceChange }: { user: User; onBalanceChange: (b: number) => void }) {
  const [bet, setBet] = useState('100');
  const [choice, setChoice] = useState<'red' | 'black' | 'green'>('red');
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ color: string; num: number } | null>(null);
  const [msg, setMsg] = useState('Выбери цвет и ставь!');

  const PAYS = { red: 2, black: 2, green: 14 };

  function spin() {
    const amount = parseInt(bet);
    if (!amount || amount <= 0 || spinning) return;
    if (amount > user.balance) { setMsg('Недостаточно PZC'); return; }
    onBalanceChange(user.balance - amount);
    setSpinning(true);
    setMsg('Шарик летит...');
    setResult(null);

    setTimeout(() => {
      const num = Math.floor(Math.random() * 37);
      let color = 'green';
      if (num !== 0) color = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(num) ? 'red' : 'black';
      setResult({ color, num });
      setSpinning(false);
      if (color === choice) {
        const pay = PAYS[choice];
        const win = amount * pay;
        onBalanceChange(user.balance - amount + win);
        setMsg(`🎉 ${color.toUpperCase()}! Выиграл x${pay} → +${win - amount} PZC`);
      } else {
        setMsg(`${color.toUpperCase()} — не твой цвет. Попробуй ещё!`);
      }
    }, 2500);
  }

  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl border border-border p-10 text-center relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="relative">
          <div className={`w-32 h-32 rounded-full mx-auto flex items-center justify-center text-5xl font-display font-bold border-4 transition-all duration-500 ${
            spinning ? 'animate-spin border-neon-purple' :
            result?.color === 'red' ? 'border-red-500 bg-red-500/20 text-red-300' :
            result?.color === 'black' ? 'border-slate-400 bg-slate-800 text-white' :
            result?.color === 'green' ? 'border-green-400 bg-green-900/50 text-green-300' :
            'border-border bg-secondary text-muted-foreground'
          }`}>
            {spinning ? '🎰' : result ? result.num : '?'}
          </div>
          <div className={`mt-6 font-display text-lg font-semibold ${
            msg.includes('Выиграл') ? 'text-neon-cyan' : msg.includes('не твой') ? 'text-destructive/70' : 'text-muted-foreground'
          }`}>{msg}</div>
        </div>
      </div>

      <div className="glass rounded-2xl border border-border p-6 space-y-4">
        <div className="flex gap-3">
          {(['red', 'black', 'green'] as const).map((c) => (
            <button key={c} onClick={() => setChoice(c)} disabled={spinning}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                choice === c
                  ? c === 'red' ? 'bg-red-500 text-white' : c === 'black' ? 'bg-slate-700 text-white' : 'bg-green-600 text-white'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}>
              {c === 'red' ? '🔴 Красное x2' : c === 'black' ? '⚫ Чёрное x2' : '🟢 Зеро x14'}
            </button>
          ))}
        </div>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1.5 block">Ставка (PZC)</label>
            <input type="number" value={bet} onChange={(e) => setBet(e.target.value)} disabled={spinning}
              className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/60" />
          </div>
          <Button onClick={spin} disabled={spinning}
            className="plasma-gradient text-background font-semibold hover:opacity-90 box-glow px-6">
            {spinning ? <Icon name="Loader" size={16} className="animate-spin mr-1" /> : null}
            {spinning ? 'Крутим...' : 'Поставить'}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Dice Game (для остальных игр) ─── */
function DiceGame({ user, onBalanceChange }: { user: User; onBalanceChange: (b: number) => void }) {
  const [bet, setBet] = useState('100');
  const [guess, setGuess] = useState<'high' | 'low'>('high');
  const [rolling, setRolling] = useState(false);
  const [dice, setDice] = useState<[number, number] | null>(null);
  const [msg, setMsg] = useState('Угадай: выше или ниже 7?');

  function roll() {
    const amount = parseInt(bet);
    if (!amount || amount <= 0 || rolling) return;
    if (amount > user.balance) { setMsg('Недостаточно PZC'); return; }
    onBalanceChange(user.balance - amount);
    setRolling(true);
    setDice(null);
    setMsg('Кубики летят...');
    setTimeout(() => {
      const d1 = Math.ceil(Math.random() * 6);
      const d2 = Math.ceil(Math.random() * 6);
      const total = d1 + d2;
      setDice([d1, d2]);
      setRolling(false);
      const win = guess === 'high' ? total > 7 : total < 7;
      if (win) {
        const prize = Math.floor(amount * 1.9);
        onBalanceChange(user.balance - amount + prize);
        setMsg(`🎉 ${total}! Угадал! +${prize - amount} PZC`);
      } else if (total === 7) {
        setMsg(`7 — ничья. Возвращаем ставку.`);
        onBalanceChange(user.balance);
      } else {
        setMsg(`${total} — не угадал. Попробуй ещё!`);
      }
    }, 1500);
  }

  const DICE_FACES = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

  return (
    <div className="space-y-6">
      <div className="glass rounded-3xl border border-border p-10 text-center relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="relative flex justify-center gap-6">
          {[dice?.[0] ?? null, dice?.[1] ?? null].map((d, i) => (
            <div key={i} className={`w-24 h-24 rounded-2xl bg-secondary border-2 flex items-center justify-center text-6xl transition-all ${
              rolling ? 'animate-pulse border-neon-purple' : d ? 'border-neon-cyan' : 'border-border'
            }`}>
              {rolling ? '🎲' : d ? DICE_FACES[d] : '?'}
            </div>
          ))}
        </div>
        {dice && <div className="mt-4 font-display text-3xl text-plasma">{dice[0] + dice[1]}</div>}
        <div className={`mt-4 font-display text-lg font-semibold ${
          msg.includes('Угадал') ? 'text-neon-cyan' : msg.includes('не угадал') ? 'text-destructive/70' : 'text-muted-foreground'
        }`}>{msg}</div>
      </div>

      <div className="glass rounded-2xl border border-border p-6 space-y-4">
        <div className="flex gap-3">
          {(['high', 'low'] as const).map((g) => (
            <button key={g} onClick={() => setGuess(g)} disabled={rolling}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                guess === g ? 'plasma-gradient text-background box-glow' : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}>
              {g === 'high' ? '📈 Выше 7 (x1.9)' : '📉 Ниже 7 (x1.9)'}
            </button>
          ))}
        </div>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1.5 block">Ставка (PZC)</label>
            <input type="number" value={bet} onChange={(e) => setBet(e.target.value)} disabled={rolling}
              className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/60" />
          </div>
          <Button onClick={roll} disabled={rolling}
            className="plasma-gradient text-background font-semibold hover:opacity-90 box-glow px-6">
            {rolling ? <Icon name="Loader" size={16} className="animate-spin mr-1" /> : null}
            Бросить
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Главный компонент страницы ─── */
export default function Game() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const meta = GAMES_META[slug ?? ''] ?? GAMES_META['void-crash'];

  useEffect(() => {
    const sid = localStorage.getItem('session_id');
    if (!sid) { navigate('/auth'); return; }
    api.me().then((res) => {
      if (res.error) { navigate('/auth'); return; }
      setUser({ id: res.id, username: res.username, balance: res.balance, is_admin: res.is_admin });
      setLoading(false);
    });
  }, [navigate]);

  function handleBalanceChange(newBalance: number) {
    setUser((u) => u ? { ...u, balance: newBalance } : null);
  }

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Icon name="Loader" size={32} className="animate-spin text-neon-purple" />
    </div>
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <Icon name="ArrowLeft" size={18} />
              <span className="font-display text-lg font-bold">
                IRRELEVANT <span className="text-plasma">KAZINO</span>
              </span>
            </button>
            <span className="text-border">·</span>
            <span className="font-display text-lg font-semibold">{meta.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass neon-border">
              <Icon name="Coins" size={15} className="text-neon-cyan" />
              <span className="font-display font-semibold text-neon-cyan text-sm">
                {user.balance.toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground">PZC</span>
            </div>
            <span className="text-xs text-muted-foreground hidden sm:block">{user.username}</span>
          </div>
        </div>
      </header>

      <div className="container py-8 max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl glass neon-border flex items-center justify-center">
            <Icon name={meta.icon} size={20} className="text-neon-cyan" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">{meta.name}</h1>
            <p className="text-xs text-muted-foreground">{meta.desc}</p>
          </div>
        </div>

        {/* Render game by type */}
        {(slug === 'void-crash') && (
          <CrashGame user={user} onBalanceChange={handleBalanceChange} />
        )}
        {(slug === 'plazma-slots' || slug === 'star-fortune') && (
          <SlotsGame user={user} onBalanceChange={handleBalanceChange} />
        )}
        {slug === 'neon-roulette' && (
          <RouletteGame user={user} onBalanceChange={handleBalanceChange} />
        )}
        {(slug === 'cyber-blackjack' || slug === 'quantum-poker' || slug === 'aurora-live' || slug === 'hyper-dice') && (
          <DiceGame user={user} onBalanceChange={handleBalanceChange} />
        )}
      </div>
    </div>
  );
}
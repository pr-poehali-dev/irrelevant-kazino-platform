import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

const HERO_BG =
  'https://cdn.poehali.dev/projects/93c0b181-ea31-44b6-8ab2-4800b81e358d/files/82d0d437-dd3e-4fb9-99ae-477cd5017dd4.jpg';

const NAV = [
  { label: 'Главная', icon: 'Home' },
  { label: 'Игры', icon: 'Dices' },
  { label: 'Турниры', icon: 'Trophy' },
  { label: 'Достижения', icon: 'Medal' },
  { label: 'VIP', icon: 'Crown' },
];

const CATEGORIES = ['Все', 'Слоты', 'Рулетка', 'Карты', 'Live', 'Краш'];

const GAMES = [
  { name: 'Plazma Slots', cat: 'Слоты', players: 1284, hot: true, icon: 'Cherry', accent: 'purple' },
  { name: 'Neon Roulette', cat: 'Рулетка', players: 842, hot: true, icon: 'CircleDot', accent: 'cyan' },
  { name: 'Cyber Blackjack', cat: 'Карты', players: 611, hot: false, icon: 'Spade', accent: 'pink' },
  { name: 'Void Crash', cat: 'Краш', players: 2043, hot: true, icon: 'TrendingUp', accent: 'blue' },
  { name: 'Quantum Poker', cat: 'Карты', players: 398, hot: false, icon: 'Diamond', accent: 'purple' },
  { name: 'Aurora Live', cat: 'Live', players: 977, hot: true, icon: 'Radio', accent: 'cyan' },
  { name: 'Hyper Dice', cat: 'Live', players: 456, hot: false, icon: 'Dices', accent: 'pink' },
  { name: 'Star Fortune', cat: 'Слоты', players: 1520, hot: false, icon: 'Sparkles', accent: 'blue' },
];

const STATS = [
  { label: 'Игроков онлайн', value: '8 942', icon: 'Users' },
  { label: 'Выплачено за день', value: '4.2M', icon: 'Coins' },
  { label: 'Активных турниров', value: '17', icon: 'Trophy' },
  { label: 'Джекпот', value: '1.8M', icon: 'Flame' },
];

const TOURNAMENTS = [
  { name: 'Plazma Cup Weekly', prize: '500 000', players: 1240, ends: '2д 14ч', tier: 'Легенда' },
  { name: 'Neon Sprint', prize: '120 000', players: 640, ends: '6ч 20м', tier: 'Про' },
  { name: 'Void Masters', prize: '850 000', players: 2100, ends: '5д 03ч', tier: 'Элита' },
];

const LEADERS = [
  { rank: 1, name: 'NeonWolf', xp: 98400, coin: '2.4M' },
  { rank: 2, name: 'PlazmaKing', xp: 91200, coin: '2.1M' },
  { rank: 3, name: 'CyberGhost', xp: 87650, coin: '1.9M' },
  { rank: 4, name: 'VoidHunter', xp: 74300, coin: '1.5M' },
  { rank: 5, name: 'AuroraX', xp: 68900, coin: '1.3M' },
];

const VIP = [
  { tier: 'Bronze', cb: '3%', color: 'from-amber-600 to-amber-400', icon: 'Shield' },
  { tier: 'Silver', cb: '6%', color: 'from-slate-400 to-slate-200', icon: 'ShieldCheck' },
  { tier: 'Gold', cb: '10%', color: 'from-yellow-500 to-yellow-300', icon: 'Crown' },
  { tier: 'Plazma', cb: '18%', color: 'from-neon-purple to-neon-cyan', icon: 'Gem' },
];

const QUESTS = [
  { title: 'Сделай 10 ставок', reward: '500', progress: 70, icon: 'Target' },
  { title: 'Выиграй в 3 играх', reward: '800', progress: 33, icon: 'Zap' },
  { title: 'Заходи 5 дней подряд', reward: '1200', progress: 80, icon: 'CalendarCheck' },
];

const accentMap: Record<string, string> = {
  purple: 'text-neon-purple',
  cyan: 'text-neon-cyan',
  pink: 'text-neon-pink',
  blue: 'text-neon-blue',
};

const Index = () => {
  const [activeCat, setActiveCat] = useState('Все');
  const [query, setQuery] = useState('');

  const filtered = GAMES.filter(
    (g) =>
      (activeCat === 'Все' || g.cat === activeCat) &&
      g.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="container flex items-center justify-between h-16 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg plasma-gradient flex items-center justify-center box-glow">
              <Icon name="Zap" size={20} className="text-background" />
            </div>
            <span className="font-display text-xl font-bold tracking-wide">
              IRRELEVANT <span className="text-plasma">KAZINO</span>
            </span>
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV.map((n) => (
              <button
                key={n.label}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <Icon name={n.icon} size={16} />
                {n.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg glass neon-border">
              <Icon name="Coins" size={16} className="text-neon-cyan" />
              <span className="font-display font-semibold text-neon-cyan">12 450</span>
              <span className="text-xs text-muted-foreground">PZC</span>
            </div>
            <Button className="plasma-gradient text-background font-semibold hover:opacity-90 box-glow">
              <Icon name="Wallet" size={16} className="mr-1" />
              Пополнить
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_BG})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/80 to-background" />
        <div className="absolute inset-0 grid-bg opacity-40" />

        {/* floating orbs */}
        <div className="absolute top-20 left-[10%] w-40 h-40 rounded-full bg-neon-purple/30 blur-3xl animate-float-slow" />
        <div className="absolute bottom-10 right-[12%] w-56 h-56 rounded-full bg-neon-cyan/20 blur-3xl animate-pulse-glow" />

        <div className="container relative py-24 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass neon-border mb-6 animate-rise">
              <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse-glow" />
              <span className="text-xs tracking-wide text-muted-foreground">
                Игровая экосистема на Plazma Coin
              </span>
            </div>

            <h1 className="font-display text-5xl md:text-7xl font-bold leading-[1.05] animate-rise" style={{ animationDelay: '0.1s' }}>
              ИГРАЙ В БУДУЩЕМ
              <br />
              <span className="text-plasma text-glow-purple">ВЫИГРЫВАЙ PLAZMA</span>
            </h1>

            <p className="mt-6 text-lg text-muted-foreground max-w-xl animate-rise" style={{ animationDelay: '0.2s' }}>
              Неоновое казино нового поколения. Турниры, VIP-уровни, достижения
              и собственная валюта Plazma Coin в единой игровой вселенной.
            </p>

            <div className="mt-8 flex flex-wrap gap-4 animate-rise" style={{ animationDelay: '0.3s' }}>
              <Button size="lg" className="plasma-gradient text-background font-semibold text-base hover:opacity-90 box-glow">
                <Icon name="Play" size={18} className="mr-1" />
                Играть сейчас
              </Button>
              <Button size="lg" variant="outline" className="neon-border text-foreground hover:bg-secondary text-base">
                <Icon name="Gift" size={18} className="mr-1" />
                Забрать бонус
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {STATS.map((s, i) => (
              <div
                key={s.label}
                className="glass rounded-xl p-5 neon-border hover-scale animate-rise"
                style={{ animationDelay: `${0.4 + i * 0.08}s` }}
              >
                <Icon name={s.icon} size={22} className="text-neon-cyan mb-3" />
                <div className="font-display text-2xl md:text-3xl font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Catalog */}
      <section className="container py-20">
        <SectionTitle icon="Dices" title="Каталог игр" sub="Найди свою удачу" />

        <div className="flex flex-col md:flex-row md:items-center gap-4 mt-8 mb-8">
          <div className="relative flex-1 max-w-sm">
            <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск игры..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setActiveCat(c)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeCat === c
                    ? 'plasma-gradient text-background box-glow'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filtered.map((g) => (
            <div
              key={g.name}
              className="group relative glass rounded-2xl p-6 border border-border hover:neon-border transition-all hover-scale cursor-pointer overflow-hidden"
            >
              <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-neon-purple/10 blur-2xl group-hover:bg-neon-purple/25 transition-colors" />
              {g.hot && (
                <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-neon-pink/20 text-neon-pink">
                  <Icon name="Flame" size={11} /> HOT
                </span>
              )}
              <div className={`w-14 h-14 rounded-xl bg-secondary flex items-center justify-center mb-4 ${accentMap[g.accent]}`}>
                <Icon name={g.icon} size={28} />
              </div>
              <h3 className="font-display text-lg font-semibold">{g.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{g.cat}</p>
              <div className="flex items-center justify-between mt-4">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Icon name="Users" size={13} /> {g.players}
                </span>
                <Icon name="ArrowUpRight" size={18} className="text-neon-cyan opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tournaments + Leaderboard */}
      <section className="container py-20">
        <SectionTitle icon="Trophy" title="Турниры" sub="Сражайся за джекпоты" />
        <div className="grid lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-2 space-y-4">
            {TOURNAMENTS.map((t) => (
              <div key={t.name} className="glass rounded-2xl p-6 border border-border hover:neon-border transition-all">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl plasma-gradient flex items-center justify-center box-glow">
                      <Icon name="Trophy" size={22} className="text-background" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-semibold">{t.name}</h3>
                      <span className="text-xs text-neon-cyan">{t.tier}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-xl font-bold text-plasma">{t.prize} PZC</div>
                    <div className="text-xs text-muted-foreground">призовой фонд</div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Icon name="Users" size={13} /> {t.players} участников
                  </span>
                  <span className="flex items-center gap-1 text-neon-pink">
                    <Icon name="Clock" size={13} /> до конца {t.ends}
                  </span>
                  <Button size="sm" className="plasma-gradient text-background font-semibold hover:opacity-90">
                    Участвовать
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Leaderboard */}
          <div className="glass rounded-2xl p-6 border border-border">
            <div className="flex items-center gap-2 mb-5">
              <Icon name="Medal" size={18} className="text-neon-cyan" />
              <h3 className="font-display text-lg font-semibold">Рейтинг игроков</h3>
            </div>
            <div className="space-y-3">
              {LEADERS.map((l) => (
                <div key={l.rank} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-colors">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold ${
                      l.rank === 1
                        ? 'plasma-gradient text-background'
                        : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {l.rank}
                  </span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{l.name}</div>
                    <div className="text-xs text-muted-foreground">{l.xp.toLocaleString()} XP</div>
                  </div>
                  <span className="text-xs font-semibold text-neon-cyan">{l.coin}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quests + VIP */}
      <section className="container py-20">
        <div className="grid lg:grid-cols-2 gap-10">
          {/* Quests */}
          <div>
            <SectionTitle icon="Target" title="Задания дня" sub="Забирай Plazma Coin" />
            <div className="space-y-4 mt-8">
              {QUESTS.map((q) => (
                <div key={q.title} className="glass rounded-2xl p-5 border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-neon-cyan">
                        <Icon name={q.icon} size={18} />
                      </div>
                      <span className="text-sm font-medium">{q.title}</span>
                    </div>
                    <span className="flex items-center gap-1 text-sm font-semibold text-neon-cyan">
                      <Icon name="Coins" size={14} /> {q.reward}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full plasma-gradient rounded-full" style={{ width: `${q.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* VIP */}
          <div>
            <SectionTitle icon="Crown" title="VIP-уровни" sub="Больше кэшбэка" />
            <div className="grid grid-cols-2 gap-4 mt-8">
              {VIP.map((v) => (
                <div key={v.tier} className="glass rounded-2xl p-6 border border-border hover:neon-border transition-all hover-scale text-center">
                  <div className={`w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br ${v.color} flex items-center justify-center mb-4`}>
                    <Icon name={v.icon} size={26} className="text-background" />
                  </div>
                  <h3 className="font-display text-lg font-semibold">{v.tier}</h3>
                  <div className="text-2xl font-display font-bold text-plasma mt-2">{v.cb}</div>
                  <div className="text-xs text-muted-foreground">кэшбэк</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20">
        <div className="relative glass rounded-3xl p-10 md:p-16 text-center overflow-hidden border border-border box-glow">
          <div className="absolute inset-0 grid-bg opacity-30" />
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-neon-purple/25 blur-3xl animate-pulse-glow" />
          <div className="relative">
            <h2 className="font-display text-3xl md:text-5xl font-bold">
              ГОТОВ ВОЙТИ В <span className="text-plasma">ИГРУ</span>?
            </h2>
            <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
              Пополни баланс через удобный платёжный шлюз и получи стартовый бонус
              к первому депозиту в Plazma Coin.
            </p>
            <Button size="lg" className="mt-8 plasma-gradient text-background font-semibold text-base hover:opacity-90 box-glow">
              <Icon name="Rocket" size={18} className="mr-1" />
              Начать играть
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg plasma-gradient flex items-center justify-center">
              <Icon name="Zap" size={16} className="text-background" />
            </div>
            <span className="font-display font-semibold">IRRELEVANT KAZINO</span>
          </div>
          <p className="text-xs text-muted-foreground">
            18+ Играй ответственно · Plazma Coin — внутриигровая валюта
          </p>
          <div className="flex gap-3">
            {['Send', 'Twitter', 'Youtube'].map((s) => (
              <button key={s} className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-neon-cyan transition-colors">
                <Icon name={s} size={16} />
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

const SectionTitle = ({ icon, title, sub }: { icon: string; title: string; sub: string }) => (
  <div className="flex items-center gap-4">
    <div className="w-11 h-11 rounded-xl glass neon-border flex items-center justify-center text-neon-cyan">
      <Icon name={icon} size={22} />
    </div>
    <div>
      <h2 className="font-display text-3xl md:text-4xl font-bold">{title}</h2>
      <p className="text-sm text-muted-foreground">{sub}</p>
    </div>
  </div>
);

export default Index;

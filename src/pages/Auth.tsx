import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res =
      mode === 'login'
        ? await api.login(form.email, form.password)
        : await api.register(form.username, form.email, form.password);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    localStorage.setItem('session_id', res.session_id);
    localStorage.setItem('is_admin', res.is_admin ? '1' : '0');
    localStorage.setItem('username', res.username);
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-background grid-bg flex items-center justify-center p-4">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/3 w-64 h-64 rounded-full bg-neon-purple/20 blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-neon-cyan/15 blur-3xl animate-float-slow" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-rise">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl plasma-gradient flex items-center justify-center box-glow">
              <Icon name="Zap" size={24} className="text-background" />
            </div>
            <span className="font-display text-2xl font-bold">
              IRRELEVANT <span className="text-plasma">KAZINO</span>
            </span>
          </div>
          <p className="text-muted-foreground text-sm">Войди и начни зарабатывать Plazma Coin</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8 border border-border box-glow animate-rise" style={{ animationDelay: '0.1s' }}>
          {/* Tabs */}
          <div className="flex rounded-xl bg-secondary p-1 mb-6">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === m ? 'plasma-gradient text-background box-glow' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {m === 'login' ? 'Войти' : 'Регистрация'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <Field label="Никнейм" icon="User" value={form.username}
                onChange={(v) => set('username', v)} placeholder="CyberPlayer" />
            )}
            <Field label="Email" icon="Mail" type="email" value={form.email}
              onChange={(v) => set('email', v)} placeholder="you@kazino.dev" />
            <Field label="Пароль" icon="Lock" type="password" value={form.password}
              onChange={(v) => set('password', v)} placeholder="••••••••" />

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                <Icon name="CircleAlert" size={16} /> {error}
              </div>
            )}

            <Button type="submit" disabled={loading}
              className="w-full plasma-gradient text-background font-semibold hover:opacity-90 box-glow h-11">
              {loading
                ? <Icon name="Loader" size={18} className="animate-spin" />
                : mode === 'login' ? 'Войти в игру' : 'Создать аккаунт'}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          18+ Играй ответственно · Plazma Coin — внутриигровая валюта
        </p>
      </div>
    </div>
  );
}

function Field({ label, icon, type = 'text', value, onChange, placeholder }: {
  label: string; icon: string; type?: string;
  value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1.5 block">{label}</label>
      <div className="relative">
        <Icon name={icon} size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type={type} value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder} required
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-secondary border border-border text-sm
            focus:outline-none focus:ring-2 focus:ring-primary/60 placeholder:text-muted-foreground/50"
        />
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { ChevronDownIcon, EyeIcon, EyeOffIcon, FlameIcon } from 'lucide-react';
import { Button } from '../components/Button';
import { LanguageSheet } from '../components/LanguageSheet';
import { t, localeLabel } from '../strings';
import type { Locale } from '../strings';
import { haptic } from '../tokens';
import type { Role } from '../ui';

interface SignInProps {
  onSuccess: (role: Role) => void;
  failNext: boolean;
  language: Locale;
  setLanguage: (l: Locale) => void;
}

export function SignIn({ onSuccess, failNext, language, setLanguage }: SignInProps) {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [reveal, setReveal] = useState(false);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const ready = id.trim().length > 0 && password.length > 0;

  function submit() {
    if (!ready) return;
    if (failNext) {
      haptic('warning');
      setError(true);
      setShake(true);
      window.setTimeout(() => setShake(false), 420);
      return;
    }
    haptic('success');
    onSuccess(id.trim().length >= 6 ? 'parent' : 'student');
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      <div className="flex h-full flex-col justify-center px-6 pb-[100px] pt-[44px]">
        <div className="flex flex-col items-center">
          <div
            className="flex h-[64px] w-[64px] items-center justify-center rounded-[18px]"
            style={{
              background: 'linear-gradient(140deg, hsl(var(--primary)), hsl(var(--accent)))'
            }}>
            
            <FlameIcon size={32} className="text-white" strokeWidth={2} />
          </div>
          <h1 className="mt-6 font-display text-largetitle font-bold text-foreground">
            {t.authWelcome}
          </h1>
          <p className="mt-1 font-sans text-subhead text-mutedfg">{t.authSubtitle}</p>
        </div>

        <div className={['mt-10', shake ? 'shake' : ''].join(' ')}>
          <div className="overflow-hidden rounded-card border border-cardborder bg-card">
            <label className="flex items-center gap-3 border-b border-hairline px-4">
              <span className="w-[92px] shrink-0 font-sans text-subhead text-mutedfg">
                {t.authIdLabel}
              </span>
              <input
                value={id}
                onChange={(e) => {
                  setError(false);
                  setId(e.target.value.replace(/\D/g, '').slice(0, 6));
                }}
                inputMode="numeric"
                placeholder={t.authIdPlaceholder}
                className="h-[50px] w-full bg-transparent font-mono text-body tracking-[2px] text-foreground outline-none placeholder:tracking-[2px] placeholder:text-mutedfg/50" />
              
            </label>
            <label className="flex items-center gap-3 px-4">
              <span className="w-[92px] shrink-0 font-sans text-subhead text-mutedfg">
                {t.authPasswordLabel}
              </span>
              <input
                value={password}
                onChange={(e) => {
                  setError(false);
                  setPassword(e.target.value);
                }}
                type={reveal ? 'text' : 'password'}
                placeholder={t.authPasswordPlaceholder}
                className="h-[50px] w-full bg-transparent font-sans text-body text-foreground outline-none placeholder:text-mutedfg/50" />
              
              <button
                type="button"
                onClick={() => setReveal((v) => !v)}
                aria-label={reveal ? t.authHidePassword : t.authShowPassword}
                className="flex h-[44px] w-[44px] items-center justify-center text-mutedfg transition-transform duration-100 ease-out active:scale-[0.97]">
                
                {reveal ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            </label>
          </div>

          {error &&
          <p className="mt-2 px-1 font-sans text-footnote text-destructive">{t.authError}</p>
          }
        </div>

        <div className="mt-6">
          <Button full disabled={!ready} onClick={submit}>
            {t.authSignIn}
          </Button>
          <p className="mt-4 text-center font-sans text-footnote text-mutedfg">{t.authForgot}</p>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-[34px] flex justify-center">
        <button
          type="button"
          onClick={() => setLangOpen(true)}
          className="flex h-[44px] items-center gap-1 px-4 font-sans text-subhead font-medium text-primary transition-[transform,opacity] duration-100 ease-out active:scale-[0.97] active:opacity-80">
          
          {localeLabel(language)}
          <ChevronDownIcon size={16} />
        </button>
      </div>

      {langOpen &&
      <LanguageSheet
        value={language}
        onChange={setLanguage}
        onClose={() => setLangOpen(false)} />

      }
    </div>);

}
import './style.css';
import { home } from './pages/home.ts';
import { game } from './pages/game.ts';
import { login } from './pages/login.ts';
import { reset } from './pages/reset.ts';

const pages: Record<string, () => void> = { home, game, login, reset };
pages[document.body.dataset.page ?? 'home']();

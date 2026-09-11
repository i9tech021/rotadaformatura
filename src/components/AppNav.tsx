// src/components/AppNav.tsx
// Navegação GLOBAL única — usada em todas as páginas (desktop, menu mobile, bottom nav).
// Edite aqui para atualizar o menu do app inteiro.
import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  Calculator,
  Calendar as CalendarIcon,
  ClipboardList,
  FileText,
  GraduationCap,
  Headphones,
  LayoutDashboard,
  Settings,
  Sparkles,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  curto: string;
  icon: LucideIcon;
}

/** Menu lateral (sheet) — ordem global. */
export const MENU_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", curto: "Inicio", icon: LayoutDashboard },
  { to: "/disciplines", label: "Disciplinas", curto: "Disciplinas", icon: BookOpen },
  { to: "/simulados", label: "Simulados", curto: "Simulado", icon: Sparkles },
  { to: "/ranking", label: "Ranking", curto: "Ranking", icon: Trophy },
  { to: "/resumos", label: "Resumos", curto: "Resumos", icon: ClipboardList },
  { to: "/podcasts", label: "Podcasts", curto: "Podcasts", icon: Headphones },
  { to: "/publicacoes", label: "Comunidade", curto: "Comunidade", icon: Users },
  { to: "/calculadora", label: "Calculadora", curto: "Calc", icon: Calculator },
  { to: "/calendar", label: "Calendario", curto: "Calendario", icon: CalendarIcon },
  { to: "/provas", label: "Provas Anteriores", curto: "Provas", icon: FileText },
  { to: "/materials", label: "Materiais", curto: "Materiais", icon: FileText },
  { to: "/settings", label: "Configuracoes", curto: "Perfil", icon: Settings },
];

/** Links desktop (topo). */
export const DESKTOP_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", curto: "Dashboard", icon: LayoutDashboard },
  { to: "/disciplines", label: "Disciplinas", curto: "Disciplinas", icon: BookOpen },
  { to: "/materials", label: "Materiais", curto: "Materiais", icon: FileText },
  { to: "/simulados", label: "Simulados", curto: "Simulados", icon: Sparkles },
  { to: "/ranking", label: "Ranking", curto: "Ranking", icon: Trophy },
  { to: "/resumos", label: "Resumos", curto: "Resumos", icon: ClipboardList },
  { to: "/provas", label: "Provas Anteriores", curto: "Provas", icon: FileText },
  { to: "/podcasts", label: "Podcasts", curto: "Podcasts", icon: Headphones },
  { to: "/publicacoes", label: "Comunidade", curto: "Comunidade", icon: Users },
];

/** Bottom nav mobile — max 5 itens. */
export const BOTTOM_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", curto: "Inicio", icon: LayoutDashboard },
  { to: "/disciplines", label: "Disciplinas", curto: "Disciplinas", icon: BookOpen },
  { to: "/materials", label: "Materiais", curto: "Materiais", icon: FileText },
  { to: "/simulados", label: "Simulados", curto: "Simulado", icon: Sparkles },
  { to: "/podcasts", label: "Podcasts", curto: "Podcasts", icon: Headphones },
];

/** Abas de hub — navegação entre páginas agrupadas (ex: Calendário > Acadêmico/Coletivo). */
export function HubTabs({ items }: { items: { to: string; label: string }[] }) {
  return (
    <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          activeProps={{ className: "bg-[#0A3D52] text-white border-[#0A3D52]" }}
          inactiveProps={{ className: "bg-white text-[#0A3D52]/70 border-[#0A3D52]/10" }}
          className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border whitespace-nowrap transition-colors"
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

/** Conteúdo do menu lateral (dentro do Sheet de cada página). */
export function AppMobileMenu() {
  return (
    <div className="p-6 pt-12 flex flex-col gap-6">
      <div className="flex items-center gap-2 mb-4">
        <GraduationCap className="w-8 h-8 text-[#D4941E]" />
        <span className="font-bold text-lg tracking-tight uppercase">Menu Acadêmico</span>
      </div>
      <div className="flex flex-col gap-2">
        {MENU_ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 text-white"
            activeProps={{ className: "bg-white/10 border-white/20 text-[#D4941E]" }}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-black text-xs uppercase tracking-widest">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/** Links do topo (desktop). */
export function AppDesktopNav() {
  return (
    <div className="hidden md:flex items-center gap-6 mr-6">
      {DESKTOP_ITEMS.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className="text-xs font-black uppercase tracking-widest hover:text-[#D4941E] transition-colors"
          activeProps={{ className: "text-[#D4941E]" }}
        >
          {item.curto}
        </Link>
      ))}
    </div>
  );
}

/** Barra inferior mobile (global). */
export function AppBottomNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#0A3D52]/10 flex justify-around p-3 pb-safe md:hidden z-40">
      {BOTTOM_ITEMS.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          activeProps={{ className: "text-[#D4941E]" }}
          inactiveProps={{ className: "text-[#0A3D52]/40" }}
          className="flex flex-col items-center"
        >
          <item.icon className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase mt-0.5 tracking-tighter">
            {item.curto}
          </span>
        </Link>
      ))}
    </div>
  );
}

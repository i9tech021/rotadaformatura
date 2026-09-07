// src/components/AppNav.tsx
// Navegação GLOBAL única — usada em todas as páginas (desktop, menu mobile, bottom nav).
// Edite aqui para atualizar o menu do app inteiro.
import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  Calculator,
  Calendar as CalendarIcon,
  FileText,
  GraduationCap,
  Headphones,
  LayoutDashboard,
  Settings,
  Sparkles,
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
  { to: "/", label: "Dashboard", curto: "Início", icon: LayoutDashboard },
  { to: "/simulados", label: "Simulados", curto: "Simulado", icon: Sparkles },
  { to: "/publicacoes", label: "Comunidade", curto: "Comunidade", icon: Users },
  { to: "/disciplines", label: "Disciplinas", curto: "Disciplinas", icon: BookOpen },
  { to: "/podcasts", label: "Podcasts", curto: "Podcasts", icon: Headphones },
  { to: "/calculadora", label: "Calculadora", curto: "Calc", icon: Calculator },
  { to: "/calendar", label: "Calendário", curto: "Calendário", icon: CalendarIcon },
  { to: "/materials", label: "Arquivos", curto: "Arquivos", icon: FileText },
  { to: "/settings", label: "Configurações", curto: "Perfil", icon: Settings },
];

/** Links desktop (topo). */
export const DESKTOP_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", curto: "Dashboard", icon: LayoutDashboard },
  { to: "/simulados", label: "Simulados", curto: "Simulados", icon: Sparkles },
  { to: "/publicacoes", label: "Comunidade", curto: "Comunidade", icon: Users },
  { to: "/disciplines", label: "Disciplinas", curto: "Disciplinas", icon: BookOpen },
  { to: "/calculadora", label: "Calculadora", curto: "Calculadora", icon: Calculator },
  { to: "/calendar", label: "Calendário", curto: "Calendário", icon: CalendarIcon },
];

/** Bottom nav mobile — máx 5 itens. */
export const BOTTOM_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", curto: "Início", icon: LayoutDashboard },
  { to: "/simulados", label: "Simulados", curto: "Simulado", icon: Sparkles },
  { to: "/publicacoes", label: "Comunidade", curto: "Comunidade", icon: Users },
  { to: "/disciplines", label: "Disciplinas", curto: "Disciplinas", icon: BookOpen },
  { to: "/calculadora", label: "Calculadora", curto: "Calc", icon: Calculator },
];

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

import { createFileRoute, Link } from "@tanstack/react-router";
import { 
  User, 
  Bell, 
  FileUp, 
  Download, 
  Shield, 
  LogOut,
  ChevronRight,
  Save,
  Trash2,
  FileText,
  ArrowLeft,
  Menu,
  GraduationCap,
  LayoutDashboard,
  Calendar as CalendarIcon,
  BookOpen,
  Settings,
  MoreVertical
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  head: () => ({
    meta: [{ title: "Configurações | Rota da Formatura" }],
  }),
});

function SettingsPage() {
  const [profile, setProfile] = useLocalStorage("academic_profile", {
    name: "Vinícius Mendonça Lobo",
    course: "Administração",
    period: "5º período",
    email: "vinicius@exemplo.com"
  });

  const [notifications, setNotifications] = useState({
    exams: true,
    materials: false,
    aiTutor: true
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Perfil atualizado com sucesso!");
  };

  const handleExportData = () => {
    const data = {
      profile,
      timestamp: new Date().toISOString(),
      app: "Rota da Formatura"
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `meus-dados-academicos-${new Date().getTime()}.json`;
    a.click();
    toast.success("Dados exportados com sucesso!");
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#0A3D52] pb-20">
      {/* Header */}
      <nav className="bg-[#0A3D52] text-white px-4 py-4 shadow-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <button className="p-2 hover:bg-white/10 rounded-xl transition-colors md:hidden cursor-pointer">
                  <Menu className="w-6 h-6 text-[#D4941E]" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="bg-[#0A3D52] text-white border-[#D4941E]/20 p-0">
                <div className="p-6 pt-12 flex flex-col gap-6">
                  <div className="flex items-center gap-2 mb-4">
                    <GraduationCap className="w-8 h-8 text-[#D4941E]" />
                    <span className="font-bold text-lg tracking-tight uppercase">Menu Acadêmico</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <MobileNavLink to="/" icon={LayoutDashboard} label="Dashboard" />
                    <MobileNavLink to="/calendar" icon={CalendarIcon} label="Calendário" />
                    <MobileNavLink to="/disciplines" icon={BookOpen} label="Disciplinas" />
                    <MobileNavLink to="/materials" icon={FileText} label="Materiais" />
                    <MobileNavLink to="/settings" icon={Settings} label="Configurações" />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-3">
              <Link to="/" className="hover:bg-white/10 p-2 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="font-bold text-lg uppercase tracking-tight hidden xs:inline">Ajustes</h1>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-xs font-black uppercase tracking-widest hover:text-[#D4941E] transition-colors">Dashboard</Link>
            <Link to="/calendar" className="text-xs font-black uppercase tracking-widest hover:text-[#D4941E] transition-colors">Agenda</Link>
            <Link to="/disciplines" className="text-xs font-black uppercase tracking-widest hover:text-[#D4941E] transition-colors">Biblioteca</Link>
            <Link to="/materials" className="text-xs font-black uppercase tracking-widest hover:text-[#D4941E] transition-colors">Arquivos</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Profile Section */}
        <section className="bg-white rounded-3xl border border-[#0A3D52]/10 shadow-sm overflow-hidden">
          <div className="bg-[#0A3D52]/5 px-8 py-4 border-b border-[#0A3D52]/10 flex items-center gap-3">
            <User className="w-5 h-5 text-[#D4941E]" />
            <h2 className="font-black text-xs uppercase tracking-[0.2em]">Seu Perfil</h2>
          </div>
          <form onSubmit={handleSaveProfile} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-[#0A3D52]/60 ml-1">Nome Completo</label>
                <input 
                  type="text" 
                  value={profile.name}
                  onChange={(e) => setProfile({...profile, name: e.target.value})}
                  className="w-full bg-[#F5F7FA] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#D4941E]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-[#0A3D52]/60 ml-1">E-mail Institucional</label>
                <input 
                  type="email" 
                  value={profile.email}
                  onChange={(e) => setProfile({...profile, email: e.target.value})}
                  className="w-full bg-[#F5F7FA] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#D4941E]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-[#0A3D52]/60 ml-1">Curso</label>
                <input 
                  type="text" 
                  value={profile.course}
                  onChange={(e) => setProfile({...profile, course: e.target.value})}
                  className="w-full bg-[#F5F7FA] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#D4941E]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-[#0A3D52]/60 ml-1">Período Atual</label>
                <select 
                  value={profile.period}
                  onChange={(e) => setProfile({...profile, period: e.target.value})}
                  className="w-full bg-[#F5F7FA] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#D4941E]"
                >
                  {[...Array(10)].map((_, i) => (
                    <option key={i} value={`${i + 1}º período`}>{i + 1}º período</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <button 
                type="submit"
                className="bg-[#D4941E] text-[#0A3D52] px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#D4941E]/20 flex items-center gap-2 hover:scale-105 transition-all"
              >
                <Save className="w-4 h-4" /> Salvar Alterações
              </button>
            </div>
          </form>
        </section>

        {/* Notifications & Materials */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="bg-white rounded-3xl border border-[#0A3D52]/10 shadow-sm overflow-hidden">
            <div className="bg-[#0A3D52]/5 px-8 py-4 border-b border-[#0A3D52]/10 flex items-center gap-3">
              <Bell className="w-5 h-5 text-[#D4941E]" />
              <h2 className="font-black text-xs uppercase tracking-[0.2em]">Notificações</h2>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm">Alertas de Avaliações</h4>
                  <p className="text-[10px] text-[#0A3D52]/50 font-bold uppercase">Lembretes de APs e ADs</p>
                </div>
                <Switch active={notifications.exams} onToggle={() => setNotifications({...notifications, exams: !notifications.exams})} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm">Novos Materiais</h4>
                  <p className="text-[10px] text-[#0A3D52]/50 font-bold uppercase">Avisos de novos PDFs/Aulas</p>
                </div>
                <Switch active={notifications.materials} onToggle={() => setNotifications({...notifications, materials: !notifications.materials})} />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-3xl border border-[#0A3D52]/10 shadow-sm overflow-hidden">
            <div className="bg-[#0A3D52]/5 px-8 py-4 border-b border-[#0A3D52]/10 flex items-center gap-3">
              <FileUp className="w-5 h-5 text-[#D4941E]" />
              <h2 className="font-black text-xs uppercase tracking-[0.2em]">Materiais Offline</h2>
            </div>
            <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#F5F7FA] flex items-center justify-center">
                <FileText className="w-8 h-8 text-[#0A3D52]/20" />
              </div>
              <p className="text-xs text-[#0A3D52]/60 font-medium">Você tem <strong>12 MB</strong> de materiais salvos localmente.</p>
              <button className="text-[#E74C3C] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:underline">
                <Trash2 className="w-3.5 h-3.5" /> Limpar Cache local
              </button>
            </div>
          </section>
        </div>

        {/* Data Management */}
        <section className="bg-[#F5F7FA] rounded-3xl border-2 border-dashed border-[#0A3D52]/10 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-3xl bg-white shadow-sm flex items-center justify-center">
              <Shield className="w-8 h-8 text-[#27AE60]" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight">Privacidade & Dados</h3>
              <p className="text-sm text-[#0A3D52]/60">Gerencie suas informações e exporte seu histórico acadêmico.</p>
            </div>
          </div>
          <button 
            onClick={handleExportData}
            className="bg-white text-[#0A3D52] px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm hover:shadow-md transition-all flex items-center gap-2 border border-[#0A3D52]/10"
          >
            <Download className="w-4 h-4" /> Baixar Meus Dados
          </button>
        </section>

        <div className="pt-8 flex justify-center">
          <button className="flex items-center gap-2 text-[#E74C3C]/60 hover:text-[#E74C3C] font-black text-xs uppercase tracking-widest transition-colors">
            <LogOut className="w-4 h-4" /> Sair da Plataforma
          </button>
        </div>
      </main>
    </div>
  );
}

function Switch({ active, onToggle }: { active: boolean, onToggle: () => void }) {
  return (
    <button 
      onClick={onToggle}
      className={cn(
        "w-12 h-6 rounded-full relative transition-colors duration-300 shadow-inner",
        active ? "bg-[#27AE60]" : "bg-[#0A3D52]/10"
      )}
    >
      <div className={cn(
        "absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-300",
        active ? "left-7" : "left-1"
      )} />
    </button>
  );
}

function MobileNavLink({ to, icon: Icon, label }: { to: string; icon: any; label: string }) {
  return (
    <Link 
      to={to} 
      className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 text-white"
      activeProps={{ className: "bg-white/10 border-white/20 text-[#D4941E]" }}
    >
      <Icon className="w-5 h-5" />
      <span className="font-black text-xs uppercase tracking-widest">{label}</span>
    </Link>
  );
}

function MoreVertical({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  );
}

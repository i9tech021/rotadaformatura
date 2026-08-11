import { createFileRoute, Link } from "@tanstack/react-router";
import { 
  ArrowLeft, 
  GraduationCap, 
  Menu, 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  BookOpen, 
  FileText, 
  Settings,
  MessageSquare,
  Heart,
  Share2,
  Trophy,
  Send,
  Plus
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { MOCK_FEED, type FeedPost } from "@/data/feed";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/community/")({
  component: CommunityFeed,
  head: () => ({
    title: "Feed da Formatura | Comunidade CEDERJ",
    meta: [{ name: "description", content: "Conecte-se com outros alunos do CEDERJ, compartilhe conquistas e tire dúvidas." }],
  }),
});

function CommunityFeed() {
  const [posts, setPosts] = useState<FeedPost[]>(MOCK_FEED);
  const [newPostContent, setNewPostContent] = useState("");

  const handlePost = () => {
    if (!newPostContent.trim()) return;
    
    const newPost: FeedPost = {
      id: `post-${Date.now()}`,
      userId: 'me',
      userName: 'Você',
      content: newPostContent,
      type: 'post',
      likes: 0,
      comments: 0,
      createdAt: new Date().toISOString(),
    };
    
    setPosts([newPost, ...posts]);
    setNewPostContent("");
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#0A3D52] pb-20">
      {/* Header */}
      <nav className="bg-[#0A3D52] text-white px-4 py-4 shadow-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
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
                    <MobileNavLink to="/community" icon={MessageSquare} label="Comunidade" />
                    <MobileNavLink to="/settings" icon={Settings} label="Configurações" />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-3">
              <Link to="/" className="hover:bg-white/10 p-2 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="font-bold text-lg uppercase tracking-tight hidden xs:inline">Feed da Formatura</h1>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 mr-6">
            <Link to="/" className="text-xs font-black uppercase tracking-widest hover:text-[#D4941E] transition-colors">Dashboard</Link>
            <Link to="/community" className="text-xs font-black uppercase tracking-widest text-[#D4941E]">Comunidade</Link>
            <Link to="/disciplines" className="text-xs font-black uppercase tracking-widest hover:text-[#D4941E] transition-colors">Biblioteca</Link>
            <Link to="/materials" className="text-xs font-black uppercase tracking-widest hover:text-[#D4941E] transition-colors">Arquivos</Link>
          </div>

          <button className="bg-[#D4941E] text-[#0A3D52] p-2 rounded-xl hover:scale-105 transition-all">
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Create Post */}
        <div className="bg-white rounded-2xl border border-[#0A3D52]/10 p-4 shadow-sm">
          <textarea
            placeholder="O que está acontecendo na sua jornada acadêmica?"
            className="w-full bg-[#F5F7FA] border-none rounded-xl p-4 text-sm focus:ring-2 focus:ring-[#D4941E] resize-none min-h-[100px]"
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
          />
          <div className="flex justify-end mt-3">
            <button 
              onClick={handlePost}
              className="bg-[#0A3D52] text-white px-6 py-2 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-[#0A3D52]/90 transition-all shadow-md"
            >
              <Send className="w-4 h-4" /> Postar
            </button>
          </div>
        </div>

        {/* Feed List */}
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id} className="bg-white rounded-2xl border border-[#0A3D52]/10 p-6 shadow-sm group hover:border-[#D4941E]/30 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#D4941E] flex items-center justify-center font-bold text-[#0A3D52] text-sm">
                    {post.userName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm leading-tight flex items-center gap-2">
                      {post.userName}
                      {post.type === 'achievement' && <Trophy className="w-3.5 h-3.5 text-[#D4941E]" />}
                    </h4>
                    <p className="text-[10px] font-bold text-[#0A3D52]/40 uppercase tracking-tighter mt-0.5">
                      {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                </div>
                {post.type === 'question' && (
                  <span className="bg-[#E74C3C]/10 text-[#E74C3C] text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-[#E74C3C]/20">
                    Dúvida
                  </span>
                )}
              </div>
              
              <p className="text-sm text-[#0A3D52]/80 leading-relaxed mb-6 font-medium">
                {post.content}
              </p>
              
              <div className="flex items-center gap-6 pt-4 border-t border-[#0A3D52]/5">
                <button className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[#0A3D52]/40 hover:text-[#E74C3C] transition-colors">
                  <Heart className="w-4 h-4" /> {post.likes}
                </button>
                <button className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[#0A3D52]/40 hover:text-[#0A3D52] transition-colors">
                  <MessageSquare className="w-4 h-4" /> {post.comments}
                </button>
                <button className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[#0A3D52]/40 hover:text-[#0A3D52] transition-colors">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Bottom Mobile Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#0A3D52]/10 flex justify-around p-3 md:hidden z-40 pb-safe">
        <Link 
          to="/" 
          activeProps={{ className: "text-[#D4941E]" }} 
          inactiveProps={{ className: "text-[#0A3D52]/40" }}
          className="flex flex-col items-center"
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase mt-1 tracking-tighter">Dashboard</span>
        </Link>
        <Link 
          to="/calendar" 
          activeProps={{ className: "text-[#D4941E]" }} 
          inactiveProps={{ className: "text-[#0A3D52]/40" }}
          className="flex flex-col items-center"
        >
          <CalendarIcon className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase mt-1 tracking-tighter">Agenda</span>
        </Link>
        <Link 
          to="/community" 
          activeProps={{ className: "text-[#D4941E]" }} 
          inactiveProps={{ className: "text-[#0A3D52]/40" }}
          className="flex flex-col items-center"
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase mt-1 tracking-tighter">Comunidade</span>
        </Link>
        <Link 
          to="/settings" 
          activeProps={{ className: "text-[#D4941E]" }} 
          inactiveProps={{ className: "text-[#0A3D52]/40" }}
          className="flex flex-col items-center"
        >
          <Settings className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase mt-1 tracking-tighter">Perfil</span>
        </Link>
      </div>
    </div>
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

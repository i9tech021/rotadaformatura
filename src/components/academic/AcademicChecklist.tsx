import { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  Circle, 
  BookOpen, 
  Headphones, 
  Video, 
  FileText,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChecklistItem {
  id: string;
  label: string;
  type: 'reading' | 'exercise' | 'podcast' | 'video' | 'material';
  completed: boolean;
}

interface Lesson {
  id: string;
  title: string;
  items: ChecklistItem[];
}

interface AcademicChecklistProps {
  disciplineId: string;
  lessons: Lesson[];
  onProgressUpdate?: (percentage: number) => void;
}

export function AcademicChecklist({ disciplineId, lessons, onProgressUpdate }: AcademicChecklistProps) {
  const [activeLessonId, setActiveLessonId] = useState(lessons[0]?.id);
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});

  const toggleItem = (itemId: string) => {
    setCompletedItems(prev => {
      const newState = { ...prev, [itemId]: !prev[itemId] };
      
      // Calculate total progress
      const allItems = lessons.flatMap(l => l.items);
      const completedCount = allItems.filter(i => newState[i.id]).length;
      const percentage = Math.round((completedCount / allItems.length) * 100);
      
      onProgressUpdate?.(percentage);
      return newState;
    });
  };

  const activeLesson = lessons.find(l => l.id === activeLessonId);

  return (
    <div className="bg-white rounded-xl border border-[#0A3D52]/10 overflow-hidden shadow-sm">
      <div className="flex border-b border-[#0A3D52]/10 overflow-x-auto no-scrollbar bg-[#F5F7FA]">
        {lessons.map((lesson) => (
          <button
            key={lesson.id}
            onClick={() => setActiveLessonId(lesson.id)}
            className={cn(
              "px-4 py-3 text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-colors",
              activeLessonId === lesson.id 
                ? "bg-white text-[#0A3D52] border-b-2 border-[#D4941E]" 
                : "text-[#0A3D52]/40 hover:text-[#0A3D52]/60"
            )}
          >
            {lesson.title}
          </button>
        ))}
      </div>

      <div className="p-5 space-y-3">
        {activeLesson?.items.map((item) => (
          <div 
            key={item.id}
            onClick={() => toggleItem(item.id)}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer group",
              completedItems[item.id] 
                ? "bg-[#27AE60]/5 border-[#27AE60]/20" 
                : "bg-white border-[#0A3D52]/5 hover:border-[#D4941E]/30"
            )}
          >
            <div className="flex-shrink-0">
              {completedItems[item.id] ? (
                <CheckCircle2 className="w-5 h-5 text-[#27AE60]" />
              ) : (
                <Circle className="w-5 h-5 text-[#0A3D52]/20 group-hover:text-[#D4941E]/40" />
              )}
            </div>
            
            <div className="flex-1">
              <p className={cn(
                "text-sm font-bold",
                completedItems[item.id] ? "text-[#27AE60] line-through opacity-70" : "text-[#0A3D52]"
              )}>
                {item.label}
              </p>
            </div>

            <div className="flex-shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
              {item.type === 'reading' && <BookOpen className="w-4 h-4" />}
              {item.type === 'podcast' && <Headphones className="w-4 h-4" />}
              {item.type === 'video' && <Video className="w-4 h-4" />}
              {item.type === 'exercise' && <FileText className="w-4 h-4" />}
            </div>
          </div>
        ))}

        {activeLesson?.items.length === 0 && (
          <div className="text-center py-8">
            <AlertCircle className="w-8 h-8 text-[#0A3D52]/10 mx-auto mb-2" />
            <p className="text-xs font-bold text-[#0A3D52]/40 uppercase">Nenhuma atividade registrada para esta aula.</p>
          </div>
        )}
      </div>

      <div className="bg-[#F5F7FA] px-5 py-4 border-t border-[#0A3D52]/10 flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase text-[#0A3D52]/40">Chance de Aprovação</span>
          <span className="text-lg font-black text-[#0A3D52]">65%</span>
        </div>
        <button className="bg-[#D4941E] text-[#0A3D52] px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-wider shadow-sm hover:shadow-md transition-shadow">
          📝 Testar Preparo
        </button>
      </div>
    </div>
  );
}

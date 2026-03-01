
import React, { useState, useMemo } from 'react';
import { Plus, CheckCircle2, Circle, Trash2, Calendar, AlertCircle, ArrowUpDown } from 'lucide-react';
import { Task } from '../types';

interface TaskTrackerProps {
  tasks: Task[];
  onAddTask: (text: string, priority: Task['priority']) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

const TaskTracker: React.FC<TaskTrackerProps> = ({ tasks, onAddTask, onToggleTask, onDeleteTask }) => {
  const [newTaskText, setNewTaskText] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [sortByPriority, setSortByPriority] = useState(false);

  const priorityWeight = {
    high: 3,
    medium: 2,
    low: 1
  };

  const sortedTasks = useMemo(() => {
    if (!sortByPriority) return tasks;
    return [...tasks].sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    });
  }, [tasks, sortByPriority]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskText.trim()) {
      onAddTask(newTaskText.trim(), priority);
      setNewTaskText('');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <form onSubmit={handleSubmit} className="mb-10 flex gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="Initialize new protocol..."
            className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[1.5rem] px-6 py-4 text-xs font-black text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all shadow-inner"
          />
        </div>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Task['priority'])}
          className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[1.5rem] px-4 py-4 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 outline-none cursor-pointer hover:bg-slate-200 dark:hover:bg-white/10 transition-all shadow-inner"
        >
          <option value="low" className="bg-white dark:bg-[#0f172a]">Low</option>
          <option value="medium" className="bg-white dark:bg-[#0f172a]">Med</option>
          <option value="high" className="bg-white dark:bg-[#0f172a]">High</option>
        </select>
        <button
          type="submit"
          disabled={!newTaskText.trim()}
          className="bg-indigo-600 text-white px-6 rounded-[1.5rem] hover:bg-indigo-500 transition-all disabled:opacity-30 disabled:grayscale active:scale-95 shadow-xl shadow-indigo-500/20"
        >
          <Plus size={20} />
        </button>
      </form>

      <div className="flex justify-between items-center mb-6 px-2">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-slate-500">
            {sortByPriority ? 'Priority Sequence' : 'Temporal Registry'}
          </p>
        </div>
        <button 
          onClick={() => setSortByPriority(!sortByPriority)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
            sortByPriority 
              ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500 shadow-lg' 
              : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ArrowUpDown size={12} />
          Sort
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-2">
        {sortedTasks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-12 opacity-20">
            <Calendar size={40} className="text-slate-400 mb-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500">No Pending Protocols</p>
          </div>
        ) : (
          sortedTasks.map((task) => (
            <div
              key={task.id}
              className={`group flex items-center gap-5 p-6 rounded-[2rem] border transition-all duration-500 ${
                task.completed
                  ? 'bg-emerald-500/5 border-emerald-500/10 opacity-50'
                  : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-indigo-500/30 shadow-lg'
              }`}
            >
              <button
                onClick={() => onToggleTask(task.id)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  task.completed ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-indigo-500 border border-slate-200 dark:border-white/10'
                }`}
              >
                {task.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
              </button>
              
              <div className="flex-1 min-w-0 space-y-1">
                <p className={`text-sm font-black uppercase tracking-tight truncate transition-all ${
                  task.completed ? 'text-slate-500 line-through' : 'text-slate-900 dark:text-white'
                }`}>
                  {task.text}
                </p>
                <div className="flex items-center gap-3">
                  <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${
                    task.priority === 'high' 
                      ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
                      : task.priority === 'medium'
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                  }`}>
                    {task.priority}
                  </span>
                  <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-white/10"></div>
                  <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    {new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onDeleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 w-10 h-10 bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-lg"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskTracker;

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Sparkles, 
  Plus, 
  Calendar, 
  ChevronRight, 
  ChevronLeft, 
  ArrowUpRight, 
  Building,
  MoreVertical,
  Flame,
  Brain,
  Layers
} from 'lucide-react';
import { formatCurrency } from '../utils/crmUtils';
import { Lead } from '../types';

export const PipelinePage: React.FC = () => {
  const { 
    stages, 
    leads, 
    changeLeadStage, 
    setSelectedLeadId, 
    setCurrentView, 
    openAIModal, 
    openScoreWhyModal,
    openAnalyzeModal,
    openSequenceModal,
    setIsAddLeadModalOpen 
  } = useApp();

  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId);
    setDraggedLeadId(leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain') || draggedLeadId;
    if (leadId) {
      await changeLeadStage(leadId, targetStageId);
    }
    setDraggedLeadId(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Sales Pipeline</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Drag & drop leads across stages. Status changes automatically log to client timelines.
          </p>
        </div>
        <button
          onClick={() => setIsAddLeadModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Lead</span>
        </button>
      </div>

      {/* Kanban Board Columns Container */}
      <div className="flex gap-4 overflow-x-auto pb-6 pt-1 snap-x">
        {stages.map((stage, stageIndex) => {
          const stageLeads = leads.filter((l) => l.stage_id === stage.id);
          const stageTotal = stageLeads.reduce((acc, l) => acc + (Number(l.deal_value) || 0), 0);

          return (
            <div
              key={stage.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
              className="flex-shrink-0 w-72 sm:w-80 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 flex flex-col max-h-[calc(100vh-210px)] snap-start"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200/80">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: stage.color }} />
                  <h3 className="font-bold text-slate-900 text-sm">{stage.name}</h3>
                  <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                    {stageLeads.length}
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-600">
                  {formatCurrency(stageTotal, 'INR')}
                </span>
              </div>

              {/* Cards Container */}
              <div className="overflow-y-auto space-y-3 flex-1 pr-1">
                {stageLeads.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                    Drop leads here
                  </div>
                ) : (
                  stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      className="group rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all cursor-grab active:cursor-grabbing"
                    >
                      {/* Card Top */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <button
                            onClick={() => {
                              setSelectedLeadId(lead.id);
                              setCurrentView('lead-detail');
                            }}
                            className="font-bold text-slate-900 text-xs sm:text-sm hover:text-indigo-600 text-left transition"
                          >
                            {lead.name}
                          </button>
                          {lead.company && (
                            <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                              {lead.company}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => openScoreWhyModal(lead)}
                          title="Click to view Why This Score"
                          className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-extrabold uppercase transition hover:scale-105 ${
                            lead.score_category === 'HOT'
                              ? 'bg-rose-100 text-rose-700'
                              : lead.score_category === 'WARM'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Flame className="h-2.5 w-2.5" />
                          <span>{lead.priority_score || 50}</span>
                        </button>
                      </div>

                      {/* Card Middle: Service & Deal Value */}
                      <div className="mt-2.5 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                        <span className="font-extrabold text-slate-900">
                          {formatCurrency(lead.deal_value, lead.currency)}
                        </span>
                        <span className="text-[11px] text-slate-400 truncate max-w-[120px]">
                          {lead.service || 'Consulting'}
                        </span>
                      </div>

                      {/* Card Bottom: Follow-up & Actions */}
                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-50 text-[11px]">
                        <div className="text-slate-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          <span className="text-[10px]">
                            {lead.next_followup_at
                              ? new Date(lead.next_followup_at).toLocaleDateString()
                              : 'No follow-up'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Previous Stage */}
                          {stageIndex > 0 && (
                            <button
                              onClick={() => changeLeadStage(lead.id, stages[stageIndex - 1].id)}
                              className="rounded p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                              title="Move back"
                            >
                              <ChevronLeft className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {/* Quick AI follow-up */}
                          <button
                            onClick={() => openAIModal(lead)}
                            className="rounded p-1 text-indigo-600 hover:bg-indigo-50 transition"
                            title="Generate AI Follow-up"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                          </button>

                          {/* Quick AI Analyze */}
                          <button
                            onClick={() => openAnalyzeModal(lead)}
                            className="rounded p-1 text-amber-600 hover:bg-amber-50 transition"
                            title="Analyze Deal & Conversations"
                          >
                            <Brain className="h-3.5 w-3.5" />
                          </button>

                          {/* Next Stage */}
                          {stageIndex < stages.length - 1 && (
                            <button
                              onClick={() => changeLeadStage(lead.id, stages[stageIndex + 1].id)}
                              className="rounded p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                              title="Move next"
                            >
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

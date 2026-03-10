
import React, { useState, useMemo } from 'react';
import { Meeting, ProductionVideo, Notification } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface MeetingsViewProps {
  meetings: Meeting[];
  videos: ProductionVideo[];
  notifications: Notification[];
  onAddMeeting: (meeting: Meeting) => void;
  onAddVideo: (video: ProductionVideo) => void;
}

const MeetingsView: React.FC<MeetingsViewProps> = ({ meetings, videos, notifications, onAddMeeting, onAddVideo }) => {
  const [showAddMeeting, setShowAddMeeting] = useState(false);
  const [meetingForm, setMeetingForm] = useState({ title: '', date: '', time: '', location: '' });

  // Filtragem de Notificações Urgentes para Pauta
  const urgentAgendaTopics = useMemo(() => {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    return notifications.filter(n => {
      if (n.status === 'Resolved') return false;
      const parts = n.deadline.split('/');
      if (parts.length !== 3) return false;
      const deadlineDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      return deadlineDate <= thirtyDaysFromNow;
    }).slice(0, 5); // Pega as 5 mais urgentes
  }, [notifications]);

  const chartDataMeetings = useMemo(() => {
    const tech = meetings.filter(m => m.type === 'Technical').length;
    const comm = meetings.filter(m => m.type === 'Commercial').length;
    const insp = meetings.filter(m => m.type === 'Inspection').length;
    return [
      { name: 'Técnica', value: tech || 0.1, color: '#002D62' },
      { name: 'Comercial', value: comm || 0.1, color: '#00B08E' },
      { name: 'Vistoria', value: insp || 0.1, color: '#3FA9F5' }
    ];
  }, [meetings]);

  const handleAddMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    const newMeeting: Meeting = {
      id: Math.random().toString(36).substr(2, 9),
      participants: ['Baccarim Engenharia'],
      type: 'Technical',
      ...meetingForm
    };
    onAddMeeting(newMeeting);
    setShowAddMeeting(false);
    setMeetingForm({ title: '', date: '', time: '', location: '' });
  };

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-3 text-baccarim-blue text-[10px] md:text-xs font-black uppercase tracking-[0.3em]">
            <i className="fas fa-calendar-check"></i>
            <span>Baccarim Ops</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-black text-baccarim-navy tracking-tight">Reuniões & Produção</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sugestão de Pauta Baseada em Notificações Urgentes */}
        <div className="lg:col-span-2 bg-gradient-to-br from-white to-slate-50 rounded-[2.5rem] p-8 md:p-10 shadow-xl border border-slate-100">
           <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-baccarim-navy">Sugestões de Pauta</h3>
                <p className="text-[10px] text-baccarim-text-muted font-black uppercase tracking-widest mt-1">Urgências baseadas na Agenda Técnica</p>
              </div>
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center animate-pulse">
                <i className="fas fa-triangle-exclamation"></i>
              </div>
           </div>

           <div className="space-y-4">
              {urgentAgendaTopics.length > 0 ? urgentAgendaTopics.map(topic => (
                <div key={topic.id} className="p-5 bg-baccarim-card rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-red-200 transition-all">
                   <div className="flex items-center space-x-4">
                      <div className="w-2 h-10 bg-red-500 rounded-full"></div>
                      <div>
                         <h4 className="text-sm font-black text-baccarim-navy group-hover:text-red-600 transition-colors">{topic.title}</h4>
                         <p className="text-[10px] text-baccarim-text-muted font-bold uppercase tracking-widest">{topic.clientName} • Prazo: {topic.deadline}</p>
                      </div>
                   </div>
                   <button className="text-[9px] font-black text-baccarim-blue uppercase tracking-widest px-4 py-2 bg-baccarim-blue/5 rounded-xl hover:bg-baccarim-blue hover:text-baccarim-text transition-all">
                      Incluir Pauta
                   </button>
                </div>
              )) : (
                <div className="text-center py-10">
                   <p className="text-baccarim-text-muted font-bold text-xs uppercase tracking-widest">Nenhuma notificação crítica pendente</p>
                </div>
              )}
           </div>
        </div>

        {/* Gráfico de Distribuição de Reuniões */}
        <div className="bg-baccarim-card rounded-[2.5rem] p-8 md:p-10 shadow-xl border border-slate-100 flex flex-col items-center">
           <h3 className="text-[10px] font-black text-baccarim-text-muted uppercase tracking-[0.2em] mb-8">Tipos de Reunião</h3>
           <div className="w-full h-48">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie data={chartDataMeetings} innerRadius={50} outerRadius={70} paddingAngle={10} dataKey="value">
                       {chartDataMeetings.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                 </PieChart>
              </ResponsiveContainer>
           </div>
           <div className="grid grid-cols-1 gap-2 mt-6 w-full">
              {chartDataMeetings.map(d => (
                <div key={d.name} className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest p-2 bg-baccarim-hover rounded-xl">
                   <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                      <span className="text-baccarim-text-muted">{d.name}</span>
                   </div>
                   <span className="text-baccarim-navy">{Math.floor(d.value)}</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
        {/* Lista de Reuniões Agendadas */}
        <div className="bg-baccarim-card rounded-3xl md:rounded-[3rem] p-6 md:p-10 shadow-xl border border-slate-100 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h3 className="text-lg md:text-xl font-black text-baccarim-navy flex items-center">
              <i className="fas fa-handshake mr-3 text-baccarim-blue"></i> Próximos Compromissos
            </h3>
            <button onClick={() => setShowAddMeeting(true)} className="w-10 h-10 rounded-xl bg-baccarim-blue text-baccarim-text flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-baccarim-blue/20">
               <i className="fas fa-plus text-xs"></i>
            </button>
          </div>
          <div className="space-y-4 flex-1">
            {meetings.length > 0 ? meetings.map(meeting => (
              <div key={meeting.id} className="p-4 md:p-6 bg-baccarim-hover rounded-2xl md:rounded-3xl border border-slate-100 relative group overflow-hidden hover:bg-baccarim-card hover:shadow-lg transition-all">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-baccarim-blue"></div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black text-baccarim-blue uppercase tracking-widest">{meeting.time}</span>
                  <span className="text-[9px] font-bold bg-baccarim-card px-2 py-1 rounded-lg border border-slate-100">{meeting.date}</span>
                </div>
                <h4 className="text-sm font-black text-baccarim-navy mb-1 line-clamp-1">{meeting.title}</h4>
                <p className="text-[10px] text-baccarim-text-muted font-medium truncate"><i className="fas fa-location-dot mr-1 opacity-50"></i> {meeting.location}</p>
              </div>
            )) : (
              <div className="text-center py-20 opacity-30">
                 <i className="fas fa-calendar-alt text-4xl mb-4"></i>
                 <p className="text-[10px] font-black uppercase tracking-widest">Nenhum compromisso agendado</p>
              </div>
            )}
          </div>
        </div>

        {/* Produção de Vídeos / Drone */}
        <div className="bg-baccarim-card rounded-3xl md:rounded-[3rem] p-6 md:p-10 shadow-xl border border-slate-100 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h3 className="text-lg md:text-xl font-black text-baccarim-navy flex items-center">
              <i className="fas fa-video mr-3 text-baccarim-green"></i> Produção Drone & Obra
            </h3>
          </div>
          <div className="space-y-4 flex-1">
            {videos.map(video => (
              <div key={video.id} className="p-4 md:p-6 bg-baccarim-hover rounded-2xl md:rounded-3xl border border-slate-100 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${
                    video.status === 'Done' ? 'bg-emerald-100 text-emerald-600' : 'bg-baccarim-blue/10 text-baccarim-blue'
                  }`}>
                    {video.status}
                  </span>
                  <span className="text-[8px] md:text-[9px] font-bold text-baccarim-text-muted">{video.deadline}</span>
                </div>
                <h4 className="text-sm font-black text-baccarim-navy">{video.title}</h4>
              </div>
            ))}
          </div>
          <button className="mt-6 w-full py-5 bg-baccarim-green text-baccarim-text rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-baccarim-green/20 hover:scale-105 active:scale-95">
            + SOLICITAR NOVA PRODUÇÃO
          </button>
        </div>
      </div>

      {/* Modal Agendamento */}
      {showAddMeeting && (
        <div className="fixed inset-0 bg-baccarim-navy/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-baccarim-card rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden p-10 md:p-12 relative">
            <h3 className="text-2xl font-black text-baccarim-navy mb-8">Agendar Novo Ponto de Controle</h3>
            <form onSubmit={handleAddMeeting} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Assunto / Pauta Principal</label>
                <input required value={meetingForm.title} onChange={e => setMeetingForm({...meetingForm, title: e.target.value})} className="w-full bg-baccarim-hover border border-slate-100 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-baccarim-blue font-bold" placeholder="Ex: Vistoria Campo" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Data</label>
                  <input type="date" required value={meetingForm.date} onChange={e => setMeetingForm({...meetingForm, date: e.target.value})} className="w-full bg-baccarim-hover border border-slate-100 p-4 rounded-2xl outline-none font-bold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Horário</label>
                  <input type="time" required value={meetingForm.time} onChange={e => setMeetingForm({...meetingForm, time: e.target.value})} className="w-full bg-baccarim-hover border border-slate-100 p-4 rounded-2xl outline-none font-bold" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest ml-1">Local / Link</label>
                <input required value={meetingForm.location} onChange={e => setMeetingForm({...meetingForm, location: e.target.value})} className="w-full bg-baccarim-hover border border-slate-100 p-4 rounded-2xl outline-none font-bold" placeholder="Ex: Sede Baccarim ou Google Meet" />
              </div>
              <div className="flex gap-4 pt-6">
                <button type="submit" className="flex-1 bg-baccarim-navy text-baccarim-text py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-baccarim-blue transition-all">Confirmar Agendamento</button>
                <button type="button" onClick={() => setShowAddMeeting(false)} className="px-8 bg-baccarim-active text-baccarim-text-muted py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingsView;

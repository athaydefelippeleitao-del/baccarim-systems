const fs = require('fs');
const path = 'components/ProjectsView.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add fields 20-23 to Seção II
const sectionIIRest = `
                        <div className="space-y-1.5 lg:col-span-3">
                          <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">20 Corpo Hídrico Receptor</label>
                          {isEditing ? <input value={project.specs.corpoHidrico} onChange={(e) => updateSpecField(project, 'corpoHidrico', e.target.value)} className="w-full bg-baccarim-hover border border-baccarim-border p-2.5 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue" /> : <p className="text-[14px] font-black text-baccarim-text">{project.specs.corpoHidrico || '-'}</p>}
                        </div>
                        <div className="space-y-1.5 lg:col-span-3">
                          <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">21 Bacia Hidrográfica</label>
                          {isEditing ? <input value={project.specs.baciaHidrografica} onChange={(e) => updateSpecField(project, 'baciaHidrografica', e.target.value)} className="w-full bg-baccarim-hover border border-baccarim-border p-2.5 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue" /> : <p className="text-[14px] font-black text-baccarim-text">{project.specs.baciaHidrografica || '-'}</p>}
                        </div>
                        <div className="space-y-1.5 lg:col-span-3">
                          <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">22 Constituintes Ambientais</label>
                          {isEditing ? <input value={project.specs.constituintesAmbientais} onChange={(e) => updateSpecField(project, 'constituintesAmbientais', e.target.value)} className="w-full bg-baccarim-hover border border-baccarim-border p-2.5 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue" /> : <p className="text-[14px] font-black text-baccarim-text">{project.specs.constituintesAmbientais || '-'}</p>}
                        </div>
                        <div className="space-y-1.5 lg:col-span-3">
                          <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">23 Descrição Detalhada do Empreendimento/Características Técnicas</label>
                          {isEditing ? <textarea value={project.specs.descricaoEmpreendimento} onChange={(e) => updateSpecField(project, 'descricaoEmpreendimento', e.target.value)} className="w-full bg-baccarim-hover border border-baccarim-border p-2.5 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue min-h-[80px]" /> : <p className="text-[14px] font-black text-baccarim-text">{project.specs.descricaoEmpreendimento || '-'}</p>}
                        </div>`;

const field19Target = `                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">19 Número de Unidades</label>
                          {isEditing ? <input value={project.specs.numUnits} onChange={(e) => updateSpecField(project, 'numUnits', e.target.value)} className="w-full bg-baccarim-hover border border-baccarim-border p-2.5 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue" /> : <p className="text-[14px] font-black text-baccarim-text">{project.specs.numUnits || '-'}</p>}
                        </div>`;

content = content.replace(field19Target, field19Target + sectionIIRest);

// 2. Insert Seção III and Seção IV before DADOS TÉCNICOS ADICIONAIS
const newSections = `
                    {/* III - RESPONSABILIDADE TÉCNICA */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 border-b border-baccarim-border pb-3">
                        <span className="text-[10px] font-black bg-baccarim-blue text-white px-2 py-0.5 rounded">III</span>
                        <h5 className="text-[11px] font-black text-baccarim-text uppercase tracking-widest">Responsabilidade Técnica</h5>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-1.5 lg:col-span-2">
                          <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">24 Nome do Responsável Técnico</label>
                          {isEditing ? <input value={project.specs.nomeResponsavel} onChange={(e) => updateSpecField(project, 'nomeResponsavel', e.target.value)} className="w-full bg-baccarim-hover border border-baccarim-border p-2.5 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue" /> : <p className="text-[14px] font-black text-baccarim-text">{project.specs.nomeResponsavel || '-'}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">25 Registro CREA/CAU</label>
                          {isEditing ? <input value={project.specs.registro} onChange={(e) => updateSpecField(project, 'registro', e.target.value)} className="w-full bg-baccarim-hover border border-baccarim-border p-2.5 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue" /> : <p className="text-[14px] font-black text-baccarim-text">{project.specs.registro || '-'}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">26 Região/Unidade</label>
                          {isEditing ? <input value={project.specs.regiaoUnidade} onChange={(e) => updateSpecField(project, 'regiaoUnidade', e.target.value)} className="w-full bg-baccarim-hover border border-baccarim-border p-2.5 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue" /> : <p className="text-[14px] font-black text-baccarim-text">{project.specs.regiaoUnidade || '-'}</p>}
                        </div>
                        <div className="space-y-1.5 lg:col-span-2">
                          <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">27 Qualificação Profissional</label>
                          {isEditing ? <input value={project.specs.qualificacao} onChange={(e) => updateSpecField(project, 'qualificacao', e.target.value)} className="w-full bg-baccarim-hover border border-baccarim-border p-2.5 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue" /> : <p className="text-[14px] font-black text-baccarim-text">{project.specs.qualificacao || '-'}</p>}
                        </div>
                        <div className="space-y-1.5 lg:col-span-2">
                          <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">28 Endereço</label>
                          {isEditing ? <input value={project.specs.enderecoResp} onChange={(e) => updateSpecField(project, 'enderecoResp', e.target.value)} className="w-full bg-baccarim-hover border border-baccarim-border p-2.5 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue" /> : <p className="text-[14px] font-black text-baccarim-text">{project.specs.enderecoResp || '-'}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">29 Bairro</label>
                          {isEditing ? <input value={project.specs.bairroResp} onChange={(e) => updateSpecField(project, 'bairroResp', e.target.value)} className="w-full bg-baccarim-hover border border-baccarim-border p-2.5 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue" /> : <p className="text-[14px] font-black text-baccarim-text">{project.specs.bairroResp || '-'}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">30 Município / UF</label>
                          {isEditing ? <input value={project.specs.municipioResp} onChange={(e) => updateSpecField(project, 'municipioResp', e.target.value)} className="w-full bg-baccarim-hover border border-baccarim-border p-2.5 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue" /> : <p className="text-[14px] font-black text-baccarim-text">{project.specs.municipioResp || '-'}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">31 CEP</label>
                          {isEditing ? <input value={project.specs.cepResp} onChange={(e) => updateSpecField(project, 'cepResp', e.target.value)} className="w-full bg-baccarim-hover border border-baccarim-border p-2.5 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue" /> : <p className="text-[14px] font-black text-baccarim-text">{project.specs.cepResp || '-'}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">32 Email</label>
                          {isEditing ? <input value={project.specs.emailResp} onChange={(e) => updateSpecField(project, 'emailResp', e.target.value)} className="w-full bg-baccarim-hover border border-baccarim-border p-2.5 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue" /> : <p className="text-[14px] font-black text-baccarim-text">{project.specs.emailResp || '-'}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">33 Telefone</label>
                          {isEditing ? <input value={project.specs.telefoneResp} onChange={(e) => updateSpecField(project, 'telefoneResp', e.target.value)} className="w-full bg-baccarim-hover border border-baccarim-border p-2.5 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue" /> : <p className="text-[14px] font-black text-baccarim-text">{project.specs.telefoneResp || '-'}</p>}
                        </div>
                      </div>
                    </div>

                    {/* IV - ASSINATURA DO REQUERIMENTO */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 border-b border-baccarim-border pb-3">
                        <span className="text-[10px] font-black bg-baccarim-blue text-white px-2 py-0.5 rounded">IV</span>
                        <h5 className="text-[11px] font-black text-baccarim-text uppercase tracking-widest">Assinatura do Requerimento</h5>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-1.5 lg:col-span-2">
                          <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">34 Nome Completo do Assinante</label>
                          {isEditing ? <input value={project.specs.nomeCompletoAssinante} onChange={(e) => updateSpecField(project, 'nomeCompletoAssinante', e.target.value)} className="w-full bg-baccarim-hover border border-baccarim-border p-2.5 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue" /> : <p className="text-[14px] font-black text-baccarim-text">{project.specs.nomeCompletoAssinante || '-'}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">35 CPF do Assinante</label>
                          {isEditing ? <input value={project.specs.cpfAssinante} onChange={(e) => updateSpecField(project, 'cpfAssinante', e.target.value)} className="w-full bg-baccarim-hover border border-baccarim-border p-2.5 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue" /> : <p className="text-[14px] font-black text-baccarim-text">{project.specs.cpfAssinante || '-'}</p>}
                        </div>
                        <div className="space-y-1.5 lg:col-span-2">
                          <label className="text-[9px] font-black text-baccarim-text-muted uppercase tracking-widest">36 Local e Data</label>
                          {isEditing ? <input value={project.specs.localData} onChange={(e) => updateSpecField(project, 'localData', e.target.value)} className="w-full bg-baccarim-hover border border-baccarim-border p-2.5 rounded-xl text-xs font-bold text-baccarim-text outline-none focus:ring-1 focus:ring-baccarim-blue" /> : <p className="text-[14px] font-black text-baccarim-text">{project.specs.localData || '-'}</p>}
                        </div>
                      </div>
                    </div>
`;

content = content.replace('{/* III - DADOS TÉCNICOS ADICIONAIS */}', newSections + '\n                    {/* V - DADOS TÉCNICOS ADICIONAIS */}');
content = content.replace(
  '<span className="text-[10px] font-black bg-baccarim-blue text-white px-2 py-0.5 rounded">III</span>',
  '<span className="text-[10px] font-black bg-baccarim-blue text-white px-2 py-0.5 rounded">V</span>'
);

content = content.replace('{/* IV - CAMPOS PERSONALIZADOS */}', '{/* VI - CAMPOS PERSONALIZADOS */}');
content = content.replace(
  '<span className="text-[10px] font-black bg-baccarim-blue text-white px-2 py-0.5 rounded">IV</span>',
  '<span className="text-[10px] font-black bg-baccarim-blue text-white px-2 py-0.5 rounded">VI</span>'
);

fs.writeFileSync(path, content);
console.log('Script ran successfully');

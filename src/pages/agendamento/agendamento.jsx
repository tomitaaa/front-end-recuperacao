import React, { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import bootstrap5Plugin from "@fullcalendar/bootstrap5";
import { v4 as uuidv4 } from "uuid";
import {
  TIPOS_SERVICO,
  formatarEventosComDuracao,
} from "../../utils/calendarConfig";
import SeletorCliente from "../../components/SeletorCliente/SeletorCliente";
import {
  clientesApi,
  agendamentosApi,
  servicosApi,
} from "../../utils/localStorageApi";
import {
  criarLembreteParaAgendamento,
  atualizarLembreteAgendamento,
  removerLembretesAgendamento,
} from "../../utils/lembretesEmailUtils";

import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputTextarea } from "primereact/inputtextarea";
import { Card } from "primereact/card";
import { Toast } from "primereact/toast";

import "./agendamento.css";

function Agendamento() {
  const toast = useRef(null);
  const calendarRef = useRef(null);
  const clienteSelectorRef = useRef(null);
  const [currentView, setCurrentView] = useState("dayGridMonth");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewEvent, setIsNewEvent] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [clients, setClients] = useState([]);
  const [agendamentos, setAgendamentos] = useState([]);
  const [tiposServico, setTiposServico] = useState([]);
  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);
  const [eventIdToDelete, setEventIdToDelete] = useState(null);
  const [eventForm, setEventForm] = useState({
    titulo: "",
    data: "",
    hora: "",
    duracao: 60,
    descricao: "",
    tipo: "outro",
    tipoServicoId: null,
    clienteId: null,
    valor: 0,
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = () => {
    try {
      // Carregar clientes usando a API
      const clientesCarregados = clientesApi.getAll();
      setClients(clientesCarregados);

      // Carregar tipos de serviço
      const tiposServicoCarregados = servicosApi.getAll();
      setTiposServico(tiposServicoCarregados);

      // Carregar agendamentos usando a API
      const agendamentosCarregados = agendamentosApi.getAll();
      setAgendamentos(agendamentosCarregados);

      console.log("Tipos de serviço carregados:", tiposServicoCarregados);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.current.show({
        severity: "error",
        summary: "Erro",
        detail: "Não foi possível carregar os dados",
        life: 3000,
      });
    }
  };

  const handleDateClick = (info) => {
    const clickDate = new Date(info.date);

    const year = clickDate.getFullYear();
    const month = String(clickDate.getMonth() + 1).padStart(2, "0");
    const day = String(clickDate.getDate()).padStart(2, "0");

    const hours = String(clickDate.getHours()).padStart(2, "0");
    const minutes = String(
      Math.floor(clickDate.getMinutes() / 15) * 15
    ).padStart(2, "0");

    // Verificar se o tipo de serviço existe e usar em minúsculas
    const tipoServicoChave = "outro";
    const serviceDuration =
      (TIPOS_SERVICO[tipoServicoChave] &&
        TIPOS_SERVICO[tipoServicoChave].duration) ||
      60;

    // Encontrar um serviço padrão para novo agendamento
    const servicoPadrao = tiposServico.length > 0 ? tiposServico[0] : null;

    setEventForm({
      titulo: "",
      data: `${year}-${month}-${day}`,
      hora: `${hours}:${minutes}`,
      duracao: serviceDuration,
      descricao: "",
      tipo: tipoServicoChave,
      tipoServicoId: servicoPadrao ? servicoPadrao.id : null,
      clienteId: selectedClientId,
      valor: servicoPadrao ? servicoPadrao.valor : 0,
    });

    setIsNewEvent(true);
    setIsModalOpen(true);
  };

  const handleEventClick = (info) => {
    const event = info.event;
    const startDate = new Date(event.start);
    const endDate = new Date(
      event.end || new Date(startDate.getTime() + 60 * 60000)
    );

    const durationMs = endDate.getTime() - startDate.getTime();
    const durationMinutes = Math.round(durationMs / 60000);

    const year = startDate.getFullYear();
    const month = String(startDate.getMonth() + 1).padStart(2, "0");
    const day = String(startDate.getDate()).padStart(2, "0");
    const hours = String(startDate.getHours()).padStart(2, "0");
    const minutes = String(startDate.getMinutes()).padStart(2, "0");

    const clienteId = event.extendedProps.clienteId || null;

    setSelectedClientId(clienteId);

    // Garantir que o tipo seja em minúsculas
    const tipoEvento = (event.extendedProps.tipo || "outro").toLowerCase();

    // Encontrar o agendamento completo para obter todas as informações
    const agendamentoCompleto = agendamentos.find((a) => a.id === event.id);
    const tipoServicoId = agendamentoCompleto?.tipoServicoId;

    // Buscar informação de valor do serviço
    let valor = 0;
    if (tipoServicoId) {
      const servico = tiposServico.find((s) => s.id === tipoServicoId);
      if (servico) {
        valor = servico.valor || 0;
      }
    }

    setEventForm({
      id: event.id,
      titulo: event.title,
      data: `${year}-${month}-${day}`,
      hora: `${hours}:${minutes}`,
      duracao: durationMinutes,
      descricao: event.extendedProps.descricao || "",
      tipo: tipoEvento,
      tipoServicoId: tipoServicoId,
      clienteId: clienteId,
      valor: valor,
    });

    setSelectedEvent(event);
    setIsNewEvent(false);
    setIsModalOpen(true);
  };

  const handleEventDrop = (info) => {
    const event = info.event;
    const startDate = new Date(event.start);
    const endDate = new Date(
      event.end || new Date(startDate.getTime() + 60 * 60000)
    );

    const durationMs = endDate.getTime() - startDate.getTime();
    const durationMinutes = Math.round(durationMs / 60000);
    const year = startDate.getFullYear();
    const month = String(startDate.getMonth() + 1).padStart(2, "0");
    const day = String(startDate.getDate()).padStart(2, "0");
    const hours = String(startDate.getHours()).padStart(2, "0");
    const minutes = String(startDate.getMinutes()).padStart(2, "0");

    // Garantir que o tipo seja em minúsculas
    const tipoEvento = (event.extendedProps.tipo || "outro").toLowerCase();

    // Encontrar o agendamento completo para preservar todas as informações
    const agendamentoOriginal = agendamentos.find((a) => a.id === event.id);

    const updatedEvent = {
      ...agendamentoOriginal,
      id: event.id,
      titulo: event.title,
      data: `${year}-${month}-${day}`,
      hora: `${hours}:${minutes}`,
      duracao: durationMinutes,
      descricao: event.extendedProps.descricao || "",
      tipo: tipoEvento,
      clienteId: event.extendedProps.clienteId || null,
      // Preservar o tipoServicoId e valor do agendamento original
      tipoServicoId: agendamentoOriginal?.tipoServicoId,
      valor: agendamentoOriginal?.valor,
    };

    handleEventUpdate(updatedEvent);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEventForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Encontrar o tipo de serviço selecionado para obter o valor
    let valor = eventForm.valor;
    if (eventForm.tipoServicoId) {
      const servico = tiposServico.find(
        (s) => s.id === eventForm.tipoServicoId
      );
      if (servico) {
        valor = servico.valor || 0;
      }
    }

    const eventData = {
      ...eventForm,
      clienteId: selectedClientId,
      valor: valor,
    };

    console.log("Dados do evento a serem salvos:", eventData);

    if (isNewEvent) {
      const newEvent = {
        ...eventData,
        id: uuidv4(),
      };
      handleEventCreate(newEvent);
    } else {
      handleEventUpdate(eventData);
    }

    closeModal();
  };

  const handleDelete = () => {
    if (selectedEvent && !isNewEvent) {
      confirmDelete(selectedEvent.id);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
    setEventForm({
      titulo: "",
      data: "",
      hora: "",
      duracao: 60,
      descricao: "",
      tipo: "outro",
      tipoServicoId: null,
      clienteId: null,
      valor: 0,
    });
  };

  const changeView = (viewName) => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.changeView(viewName);
      setCurrentView(viewName);
    }
  };

  const isDatePassed = () => {
    if (!eventForm.data || !eventForm.hora) return false;

    const selectedDateTime = new Date(`${eventForm.data}T${eventForm.hora}`);
    const now = new Date();

    return selectedDateTime < now;
  };

  const formattedEvents = formatarEventosComDuracao(agendamentos);

  // Filtrar eventos baseado no texto de busca
  const filteredEvents =
    searchText.trim() === ""
      ? formattedEvents
      : formattedEvents.filter((event) => {
          const searchLower = searchText.toLowerCase();
          const cliente = clients.find(
            (c) => c.id === event.extendedProps.clienteId
          );
          const clienteNome = cliente?.nome || "";
          const titulo = event.title || "";
          const descricao = event.extendedProps.descricao || "";

          const tipoServicoId = event.extendedProps.tipoServicoId;
          const tipoServico = tiposServico.find((s) => s.id === tipoServicoId);
          const tipoServicoNome = tipoServico?.nome || "";

          return (
            clienteNome.toLowerCase().includes(searchLower) ||
            titulo.toLowerCase().includes(searchLower) ||
            descricao.toLowerCase().includes(searchLower) ||
            tipoServicoNome.toLowerCase().includes(searchLower)
          );
        });

  const handleEventCreate = (newEvent) => {
    try {
      // Usar a API para adicionar o agendamento
      const agendamentoCriado = agendamentosApi.add(newEvent);

      // Criar lembrete por e-mail para o agendamento
      const lembreteCriado = criarLembreteParaAgendamento(agendamentoCriado);

      // Atualizar o estado local após criação bem-sucedida
      setAgendamentos((prevAgendamentos) => [
        ...prevAgendamentos,
        agendamentoCriado,
      ]);

      // Mensagem de sucesso com informação sobre lembrete
      let mensagemDetalhada = "Agendamento criado com sucesso!";
      if (lembreteCriado) {
        mensagemDetalhada += " Lembrete por e-mail agendado para 24h antes.";
      }

      toast.current.show({
        severity: "success",
        summary: "Sucesso",
        detail: mensagemDetalhada,
        life: 4000,
      });
    } catch (error) {
      console.error("Erro ao criar agendamento:", error);
      toast.current.show({
        severity: "error",
        summary: "Erro",
        detail: "Não foi possível criar o agendamento",
        life: 3000,
      });
    }
  };

  const handleEventUpdate = (updatedEvent) => {
    try {
      // Usar a API para atualizar o agendamento
      const agendamentoAtualizado = agendamentosApi.update(updatedEvent);

      if (agendamentoAtualizado) {
        // Atualizar lembrete para o agendamento modificado
        atualizarLembreteAgendamento(updatedEvent);

        // Atualizar o estado local após atualização bem-sucedida
        setAgendamentos((prevAgendamentos) =>
          prevAgendamentos.map((agendamento) =>
            agendamento.id === updatedEvent.id ? updatedEvent : agendamento
          )
        );

        toast.current.show({
          severity: "success",
          summary: "Sucesso",
          detail: "Agendamento atualizado com sucesso!",
          life: 3000,
        });
      } else {
        toast.current.show({
          severity: "error",
          summary: "Erro",
          detail: "Não foi possível atualizar o agendamento",
          life: 3000,
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar agendamento:", error);
      toast.current.show({
        severity: "error",
        summary: "Erro",
        detail: "Não foi possível atualizar o agendamento",
        life: 3000,
      });
    }
  };

  const confirmDelete = (eventId) => {
    setEventIdToDelete(eventId);
    setConfirmDialogVisible(true);
    closeModal();
  };

  const handleConfirmDelete = () => {
    if (eventIdToDelete) {
      // Usar a API para excluir o agendamento
      const sucesso = agendamentosApi.delete(eventIdToDelete);

      if (sucesso) {
        // Remover lembretes associados ao agendamento
        removerLembretesAgendamento(eventIdToDelete);

        // Atualizar o estado local após exclusão bem-sucedida
        setAgendamentos((prev) =>
          prev.filter((item) => item.id !== eventIdToDelete)
        );

        toast.current.show({
          severity: "success",
          summary: "Sucesso",
          detail: "Agendamento excluído com sucesso!",
          life: 3000,
        });
      } else {
        toast.current.show({
          severity: "error",
          summary: "Erro",
          detail: "Não foi possível excluir o agendamento",
          life: 3000,
        });
      }

      setConfirmDialogVisible(false);
      setEventIdToDelete(null);
    }
  };

  const cancelDelete = () => {
    setConfirmDialogVisible(false);
    setEventIdToDelete(null);
  };

  return (
    <div className="agendamento-page">
      <Toast ref={toast} position="bottom-right" />

      <header className="calendar-header">
        <div className="calendar-header-content">
          <h2>Sistema de Agendamentos</h2>
          <div className="relatorio-link">
            <Button
              label="Visualizar Gastos"
              icon="pi pi-chart-bar"
              className="p-button-info p-button-sm"
              onClick={() => (window.location.href = "/relatorio-gastos")}
              tooltip="Visualizar relatório de gastos dos agendamentos"
            />
          </div>
        </div>
      </header>

      <div className="calendario-avancado-container">
        <div className="advanced-calendar-container">
          <div className="calendar-layout">
            <div className="calendar-sidebar">
              <Card title="Cliente" className="p-mb-3">
                <SeletorCliente
                  ref={clienteSelectorRef}
                  selectedClientId={selectedClientId}
                  onClientSelect={setSelectedClientId}
                />
              </Card>

              <Card title="Tipos de Serviço">
                <div className="lista-tipos-servico">
                  {Object.keys(TIPOS_SERVICO).map((tipo) => (
                    <div
                      key={tipo}
                      className="item-tipo-servico p-d-flex p-ai-center p-mb-2"
                    >
                      <div
                        className="cor-tipo-servico"
                        style={{ backgroundColor: TIPOS_SERVICO[tipo].color }}
                      />
                      <div
                        className="info-tipo-servico p-d-flex p-jc-between p-ai-center p-ml-2"
                        style={{ width: "100%" }}
                      >
                        <span>{TIPOS_SERVICO[tipo].title}</span>
                        <span className="duracao-tipo-servico">
                          {TIPOS_SERVICO[tipo].duration} min
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="calendar-content">
              <div className="calendar-header">
                <div className="calendar-view-options p-buttonset">
                  <Button
                    label="Mês"
                    className={
                      currentView === "dayGridMonth"
                        ? "p-button-primary"
                        : "p-button-outlined"
                    }
                    onClick={() => changeView("dayGridMonth")}
                  />
                  <Button
                    label="Semana"
                    className={
                      currentView === "timeGridWeek"
                        ? "p-button-primary"
                        : "p-button-outlined"
                    }
                    onClick={() => changeView("timeGridWeek")}
                  />
                  <Button
                    label="Dia"
                    className={
                      currentView === "timeGridDay"
                        ? "p-button-primary"
                        : "p-button-outlined"
                    }
                    onClick={() => changeView("timeGridDay")}
                  />
                  <Button
                    label="Lista"
                    className={
                      currentView === "listMonth"
                        ? "p-button-primary"
                        : "p-button-outlined"
                    }
                    onClick={() => changeView("listMonth")}
                  />
                </div>
                <div className="calendar-header-content">
                  <div className="search-field">
                    <InputText
                      placeholder="Buscar agendamento, cliente ou observação..."
                      className="p-inputtext-sm"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="calendar-main">
                <FullCalendar
                  ref={calendarRef}
                  plugins={[
                    dayGridPlugin,
                    timeGridPlugin,
                    interactionPlugin,
                    bootstrap5Plugin,
                    listPlugin,
                  ]}
                  initialView="dayGridMonth"
                  headerToolbar={{
                    left: "prev,next today",
                    center: "title",
                    right: "",
                  }}
                  themeSystem="bootstrap5"
                  events={filteredEvents}
                  editable={true}
                  selectable={true}
                  selectMirror={true}
                  dayMaxEvents={true}
                  weekends={true}
                  height="auto"
                  locale="pt-br"
                  timeZone="local"
                  dateClick={handleDateClick}
                  eventClick={handleEventClick}
                  eventDrop={handleEventDrop}
                  eventTimeFormat={{
                    hour: "2-digit",
                    minute: "2-digit",
                    meridiem: false,
                    hour12: false,
                  }}
                  slotMinTime="07:00:00"
                  slotMaxTime="20:00:00"
                  slotDuration="00:15:00"
                  allDaySlot={false}
                  nowIndicator={true}
                  businessHours={{
                    daysOfWeek: [1, 2, 3, 4, 5],
                    startTime: "08:00",
                    endTime: "18:00",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para criar/editar agendamentos */}
      <Dialog
        header={isNewEvent ? "Criar Agendamento" : "Editar Agendamento"}
        visible={isModalOpen}
        style={{ width: "500px" }}
        modal
        className="p-fluid"
        onHide={closeModal}
        footer={
          <div className="p-d-flex p-jc-end">
            {!isNewEvent && (
              <Button
                label="Excluir"
                icon="pi pi-trash"
                className="p-button-danger p-mr-2"
                onClick={handleDelete}
              />
            )}
            <Button
              label="Cancelar"
              icon="pi pi-times"
              className="p-button-text p-mr-2"
              onClick={closeModal}
            />
            <Button
              label={isNewEvent ? "Adicionar" : "Salvar"}
              icon="pi pi-check"
              className="p-button-primary"
              onClick={handleSubmit}
              disabled={isDatePassed()}
            />
          </div>
        }
      >
        <div className="p-grid p-fluid">
          <div className="p-col-12 p-field">
            <label htmlFor="titulo">Título *</label>
            <InputText
              id="titulo"
              name="titulo"
              value={eventForm.titulo}
              onChange={handleFormChange}
              required
            />
          </div>

          <div className="p-col-12 p-field">
            <label htmlFor="tipoServicoId">Tipo de Serviço *</label>
            <Dropdown
              id="tipoServicoId"
              name="tipoServicoId"
              value={eventForm.tipoServicoId}
              options={tiposServico.map((servico) => ({
                label: `${servico.nome} - ${
                  servico.duracao
                } min - R$ ${servico.valor.toFixed(2)}`,
                value: servico.id,
                servico: servico,
              }))}
              onChange={(e) => {
                const servicoSelecionado = tiposServico.find(
                  (s) => s.id === e.value
                );
                if (servicoSelecionado) {
                  const duracaoPadrao = servicoSelecionado.duracao || 60;
                  const valorServico = servicoSelecionado.valor || 0;
                  const corServico = servicoSelecionado.cor || "673AB7";

                  setEventForm((prev) => ({
                    ...prev,
                    tipoServicoId: servicoSelecionado.id,
                    tipo: servicoSelecionado.id, // Manter compatibilidade
                    duracao: duracaoPadrao,
                    valor: valorServico,
                  }));
                }
              }}
              optionLabel="label"
              placeholder="Selecione o tipo de serviço"
              style={{
                backgroundColor: eventForm.tipoServicoId
                  ? `#${
                      tiposServico.find((s) => s.id === eventForm.tipoServicoId)
                        ?.cor || "673AB7"
                    }`
                  : "#673AB7",
                color: "#FFFFFF",
              }}
            />
            {eventForm.tipoServicoId && (
              <div className="servico-info p-mt-2">
                <span className="valor-servico">
                  Valor:{" "}
                  <strong>
                    R${" "}
                    {(
                      tiposServico.find((s) => s.id === eventForm.tipoServicoId)
                        ?.valor || 0
                    ).toFixed(2)}
                  </strong>
                </span>
              </div>
            )}
          </div>

          <div className="p-col-12 p-field">
            <label>Cliente</label>
            <div className="client-selector-container">
              {selectedClientId ? (
                <div className="selected-client-display p-d-flex p-jc-between p-ai-center">
                  <span className="client-name">
                    {clients.find((c) => c.id === selectedClientId)?.nome ||
                      "Cliente selecionado"}
                  </span>
                  <Button
                    label="Alterar"
                    className="p-button-text p-button-sm"
                    onClick={() => setSelectedClientId(null)}
                  />
                </div>
              ) : (
                <Button
                  label="Selecionar Cliente"
                  className="p-button-outlined p-button-secondary"
                  icon="pi pi-user"
                  onClick={() => {
                    if (clienteSelectorRef.current) {
                      clienteSelectorRef.current.abrirModal();
                    }
                  }}
                />
              )}
            </div>
          </div>

          <div className="p-col-12 p-grid">
            <div className="p-col-6 p-field">
              <label htmlFor="dataCalendario">Data *</label>
              <Calendar
                id="dataCalendario"
                value={eventForm.data ? new Date(eventForm.data) : null}
                onChange={(e) => {
                  if (e.value) {
                    const date = new Date(e.value);
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, "0");
                    const day = String(date.getDate()).padStart(2, "0");

                    setEventForm((prev) => ({
                      ...prev,
                      data: `${year}-${month}-${day}`,
                    }));
                  }
                }}
                dateFormat="dd/mm/yy"
                showIcon
              />
            </div>

            <div className="p-col-3 p-field">
              <label htmlFor="hora">Hora *</label>
              <InputText
                id="hora"
                name="hora"
                type="time"
                value={eventForm.hora}
                onChange={handleFormChange}
                required
                step="900"
              />
            </div>

            <div className="p-col-3 p-field">
              <label htmlFor="duracao">Duração</label>
              <Dropdown
                id="duracao"
                name="duracao"
                value={eventForm.duracao}
                options={[
                  { label: "15 min", value: 15 },
                  { label: "30 min", value: 30 },
                  { label: "45 min", value: 45 },
                  { label: "1 hora", value: 60 },
                  { label: "1h 30min", value: 90 },
                  { label: "2 horas", value: 120 },
                  { label: "3 horas", value: 180 },
                ]}
                onChange={(e) => {
                  setEventForm((prev) => ({
                    ...prev,
                    duracao: e.value,
                  }));
                }}
                optionLabel="label"
              />
            </div>
          </div>

          <div className="p-col-12 p-field">
            <label htmlFor="descricao">Observações (opcional)</label>
            <InputTextarea
              id="descricao"
              name="descricao"
              value={eventForm.descricao}
              onChange={handleFormChange}
              rows={3}
              placeholder="Detalhes adicionais sobre o agendamento..."
            />
          </div>

          {isDatePassed() && (
            <div className="p-col-12">
              <div className="p-message p-message-error">
                <i className="pi pi-exclamation-triangle"></i>
                <span>Atenção: A data e hora selecionadas já passaram!</span>
              </div>
            </div>
          )}
        </div>
      </Dialog>

      <Dialog
        header="Confirmar Exclusão"
        visible={confirmDialogVisible}
        style={{ width: "450px" }}
        modal
        footer={
          <div className="p-d-flex p-jc-center">
            <Button
              label="Não"
              icon="pi pi-times"
              className="p-button-text"
              onClick={cancelDelete}
            />
            <Button
              label="Sim"
              icon="pi pi-check"
              className="p-button-danger"
              onClick={handleConfirmDelete}
            />
          </div>
        }
        onHide={cancelDelete}
      >
        <div className="p-d-flex p-ai-center p-jc-center">
          <i
            className="pi pi-exclamation-triangle p-mr-3"
            style={{ fontSize: "2rem", color: "#ff5252" }}
          />
          <span>Tem certeza de que deseja excluir este agendamento?</span>
        </div>
      </Dialog>
    </div>
  );
}

export default Agendamento;

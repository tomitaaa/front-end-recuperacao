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
  const [clients, setClients] = useState([]);
  const [agendamentos, setAgendamentos] = useState([]);
  const [tiposServico, setTiposServico] = useState([]);
  const [searchText, setSearchText] = useState("");
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
  const [duplicateDialogVisible, setDuplicateDialogVisible] = useState(false);
  const [duplicateDate, setDuplicateDate] = useState(null);
  const [duplicateTime, setDuplicateTime] = useState("");
  const [weekendConfirmVisible, setWeekendConfirmVisible] = useState(false);
  const [pendingEventData, setPendingEventData] = useState(null);
  const [pendingDuplicateData, setPendingDuplicateData] = useState(null);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = () => {
    try {
      const clientesCarregados = clientesApi.getAll();
      setClients(clientesCarregados);

      const tiposServicoCarregados = servicosApi.getAll();
      setTiposServico(tiposServicoCarregados);

      const agendamentosCarregados = agendamentosApi.getAll();
      setAgendamentos(agendamentosCarregados);
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

    const tipoServicoChave = "outro";
    const serviceDuration =
      (TIPOS_SERVICO[tipoServicoChave] &&
        TIPOS_SERVICO[tipoServicoChave].duration) ||
      60;

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

    const tipoEvento = (event.extendedProps.tipo || "outro").toLowerCase();
    const agendamentoCompleto = agendamentos.find((a) => a.id === event.id);
    const tipoServicoId = agendamentoCompleto?.tipoServicoId;

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
    const tipoEvento = (event.extendedProps.tipo || "outro").toLowerCase();
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
      tipoServicoId: agendamentoOriginal?.tipoServicoId,
      valor: agendamentoOriginal?.valor,
    };

    handleEventUpdate(updatedEvent);
  };

  const renderEventContent = (eventInfo) => {
    const tipoServico = eventInfo.event.extendedProps?.tipoServico;
    const color =
      (tipoServico && tipoServico.color) ||
      eventInfo.event.backgroundColor ||
      "#673AB7";
    const timeText = eventInfo.timeText || "";

    return (
      <div className="fc-event-custom" title={eventInfo.event.title}>
        <span className="fc-event-dot" style={{ backgroundColor: color }} />
        <span className="fc-event-title-text">
          {timeText ? `${timeText} ` : ""}
          {eventInfo.event.title}
        </span>
      </div>
    );
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

    if (isNewEvent) {
      const temConflito = agendamentos.some((agendamento) => {
        return (
          agendamento.data === eventData.data &&
          agendamento.hora === eventData.hora
        );
      });

      if (temConflito) {
        toast.current.show({
          severity: "error",
          summary: "Conflito no horário",
          detail:
            "Já existe um agendamento para esta data e hora. Altere a data ou hora.",
          life: 4000,
        });
        return;
      }
    }

    if (isNewEvent && isWeekend(eventData.data)) {
      setPendingEventData({
        ...eventData,
        id: uuidv4(),
      });
      setWeekendConfirmVisible(true);
      return;
    }

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

  const goToToday = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.today();
    }
  };

  const isDatePassed = () => {
    if (!eventForm.data || !eventForm.hora) return false;

    const selectedDateTime = new Date(`${eventForm.data}T${eventForm.hora}`);
    const now = new Date();

    return selectedDateTime < now;
  };

  const formattedEvents = formatarEventosComDuracao(agendamentos);

  const filteredEvents = (() => {
    const q = (searchText || "").trim().toLowerCase();
    if (!q) return formattedEvents;

    return formattedEvents.filter((ev) => {
      const cliente = clients.find((c) => c.id === ev.extendedProps.clienteId);
      const tipoServicoId = ev.extendedProps?.tipoServicoId;
      const tipoServico = tiposServico.find((s) => s.id === tipoServicoId);
      const tipoNome =
        tipoServico?.nome || ev.extendedProps?.tipoServico?.title || "";
      return (
        (cliente && cliente.nome && cliente.nome.toLowerCase().includes(q)) ||
        (ev.title && ev.title.toLowerCase().includes(q)) ||
        (ev.extendedProps &&
          ev.extendedProps.descricao &&
          ev.extendedProps.descricao.toLowerCase().includes(q)) ||
        (tipoNome && tipoNome.toLowerCase().includes(q))
      );
    });
  })();

  const handleEventCreate = (newEvent) => {
    try {
      const agendamentoCriado = agendamentosApi.add(newEvent);

      const lembreteCriado = criarLembreteParaAgendamento(agendamentoCriado);

      setAgendamentos((prevAgendamentos) => [
        ...prevAgendamentos,
        agendamentoCriado,
      ]);

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
      const agendamentoAtualizado = agendamentosApi.update(updatedEvent);

      if (agendamentoAtualizado) {
        atualizarLembreteAgendamento(updatedEvent);

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
      const sucesso = agendamentosApi.delete(eventIdToDelete);

      if (sucesso) {
        removerLembretesAgendamento(eventIdToDelete);
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

  const isWeekend = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    return day === 0 || day === 6;
  };

  const handleWeekendConfirm = () => {
    if (pendingEventData) {
      handleEventCreate(pendingEventData);
      setPendingEventData(null);
    } else if (pendingDuplicateData) {
      handleEventCreate(pendingDuplicateData.newEvent);
      setDuplicateDialogVisible(false);
      setDuplicateDate(null);
      setDuplicateTime("");
      setPendingDuplicateData(null);
      toast.current.show({
        severity: "success",
        summary: "Duplicado",
        detail: "Agendamento duplicado com sucesso",
        life: 3000,
      });
    }
    setWeekendConfirmVisible(false);
  };

  const handleWeekendCancel = () => {
    setWeekendConfirmVisible(false);
    setPendingEventData(null);
    setPendingDuplicateData(null);
  };

  const formatDateToYMD = (date) => {
    const d = new Date(date);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleOpenDuplicate = () => {
    if (eventForm && eventForm.data) {
      const partes = eventForm.data.split("-");
      const dateObj = new Date(`${partes[0]}-${partes[1]}-${partes[2]}`);
      dateObj.setDate(dateObj.getDate() + 1);
      setDuplicateDate(dateObj);
      setDuplicateTime(eventForm.hora || "");
    } else {
      setDuplicateDate(new Date());
      setDuplicateTime("");
    }
    setDuplicateDialogVisible(true);
  };

  const handleConfirmDuplicate = () => {
    if (!duplicateDate) {
      toast.current.show({
        severity: "warn",
        summary: "Aviso",
        detail: "Selecione a nova data para duplicar o agendamento",
        life: 3000,
      });
      return;
    }

    const timeParts = (duplicateTime || "").split(":");
    const hours = parseInt(timeParts[0] || "0", 10);
    const minutes = parseInt(timeParts[1] || "0", 10);

    const selectedDT = new Date(duplicateDate);
    selectedDT.setHours(hours, minutes, 0, 0);

    const now = new Date();

    if (selectedDT < now) {
      toast.current.show({
        severity: "error",
        summary: "Conflito no horário",
        detail:
          "Não é possível duplicar para data/hora retroativa — altere a data ou hora.",
        life: 4000,
      });
      return;
    }
    const selectedDateStr = formatDateToYMD(duplicateDate);
    const selectedHora = duplicateTime || eventForm.hora;

    const temConflito = agendamentos.some((agendamento) => {
      if (agendamento.id === eventForm.id) return false;
      return (
        agendamento.data === selectedDateStr &&
        agendamento.hora === selectedHora
      );
    });

    if (temConflito) {
      toast.current.show({
        severity: "error",
        summary: "Conflito no horário",
        detail: "Conflito no horário — altere a data ou hora.",
        life: 4000,
      });
      return;
    }

    const newEvent = {
      ...eventForm,
      id: uuidv4(),
      data: formatDateToYMD(duplicateDate),
      hora: duplicateTime || eventForm.hora,
      clienteId: selectedClientId,
      className: "evento-duplicado",
    };

    if (isWeekend(duplicateDate)) {
      setPendingDuplicateData({ newEvent });
      setWeekendConfirmVisible(true);
      return;
    }

    handleEventCreate(newEvent);

    setDuplicateDialogVisible(false);
    setDuplicateDate(null);
    setDuplicateTime("");

    toast.current.show({
      severity: "success",
      summary: "Duplicado",
      detail: "Agendamento duplicado com sucesso",
      life: 3000,
    });
  };

  return (
    <div className="agendamento-page">
      <Toast ref={toast} position="bottom-right" />

      <div style={{ display: "none" }}>
        <SeletorCliente
          ref={clienteSelectorRef}
          selectedClientId={selectedClientId}
          onClientSelect={setSelectedClientId}
          onClientCreated={(novoCliente) => {
            carregarDados();
          }}
        />
      </div>

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
                <div className="calendar-today-button">
                  <Button
                    label="Hoje"
                    icon="pi pi-calendar"
                    className="p-button-outlined p-button-sm"
                    onClick={goToToday}
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
                {searchText.trim() !== "" && filteredEvents.length === 0 ? (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      width: "100%",
                      height: "100%",
                      fontSize: "18px",
                      color: "#999",
                    }}
                  >
                    <div style={{ textAlign: "center" }}>
                      <i
                        className="pi pi-search"
                        style={{
                          fontSize: "48px",
                          marginBottom: "16px",
                          display: "block",
                        }}
                      ></i>
                      <p style={{ margin: "0 0 8px 0" }}>
                        Nenhum compromisso encontrado
                      </p>
                      <small style={{ color: "#bbb" }}>
                        Tente ajustar sua busca
                      </small>
                    </div>
                  </div>
                ) : (
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
                      left: "prev",
                      center: "title",
                      right: "next",
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
                    eventContent={renderEventContent}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

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
              <>
                <Button
                  label="Duplicar"
                  icon="pi pi-clone"
                  className="p-button-help p-mr-2"
                  onClick={handleOpenDuplicate}
                />
                <Button
                  label="Excluir"
                  icon="pi pi-trash"
                  className="p-button-danger p-mr-2"
                  onClick={handleDelete}
                />
              </>
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
                  setEventForm((prev) => ({
                    ...prev,
                    tipoServicoId: servicoSelecionado.id,
                    tipo: servicoSelecionado.id,
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
                  style={{ width: "100%" }}
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
        header="Duplicar Agendamento"
        visible={duplicateDialogVisible}
        style={{ width: "400px" }}
        modal
        onHide={() => {
          setDuplicateDialogVisible(false);
          setDuplicateDate(null);
        }}
        footer={
          <div className="p-d-flex p-jc-end">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              className="p-button-text p-mr-2"
              onClick={() => {
                setDuplicateDialogVisible(false);
                setDuplicateDate(null);
              }}
            />
            <Button
              label="Duplicar"
              icon="pi pi-clone"
              className="p-button-primary"
              onClick={handleConfirmDuplicate}
              disabled={!duplicateDate || !duplicateTime}
            />
          </div>
        }
      >
        <div className="p-grid p-fluid">
          <div className="p-col-12 p-field">
            <label>Selecione a nova data</label>
            <Calendar
              value={duplicateDate}
              onChange={(e) => setDuplicateDate(e.value)}
              dateFormat="dd/mm/yy"
              showIcon
            />
          </div>
          <div className="p-col-12 p-field">
            <label htmlFor="duplicateHora">Hora *</label>
            <InputText
              id="duplicateHora"
              type="time"
              value={duplicateTime}
              onChange={(e) => setDuplicateTime(e.target.value)}
              required
              step="900"
            />
          </div>
        </div>
      </Dialog>

      <Dialog
        header="Agendamento em Final de Semana"
        visible={weekendConfirmVisible}
        style={{ width: "450px" }}
        modal
        footer={
          <div className="p-d-flex p-jc-end">
            <Button
              label="Cancelar"
              icon="pi pi-times"
              className="p-button-text p-mr-2"
              onClick={handleWeekendCancel}
            />
            <Button
              label="Confirmar"
              icon="pi pi-check"
              className="p-button-primary"
              onClick={handleWeekendConfirm}
            />
          </div>
        }
        onHide={handleWeekendCancel}
      >
        <div className="p-d-flex p-ai-center p-jc-center">
          <i
            className="pi pi-exclamation-circle p-mr-3"
            style={{ fontSize: "2rem", color: "#ff9800" }}
          />
          <span>
            A data selecionada é um sábado ou domingo. Deseja continuar?
          </span>
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

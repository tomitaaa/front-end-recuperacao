import { servicosApi } from './localStorageApi';

export const obterTiposServico = () => {
  try {
    // Usar nossa nova API para obter tipos de serviço
    const servicos = servicosApi.getAll();
    
    if (servicos && servicos.length > 0) {
      const tiposServico = {};
      
      servicos.forEach(servico => {
        tiposServico[servico.id] = {
          id: servico.id,
          title: servico.nome,
          color: `#${servico.cor}`,
          duration: servico.duracao || 60
        };
      });
      
      return tiposServico;
    }
  } catch (error) {
    console.error('Erro ao obter tipos de serviço:', error);
  }
  
  // Valores padrão caso não existam serviços no localStorage
  return {
    'consulta': {
      id: 'consulta',
      title: 'Consulta',
      color: '#007ad9',
      duration: 60
    },
    'exame': {
      id: 'exame',
      title: 'Exame',
      color: '#34A835',
      duration: 45
    },
    'retorno': {
      id: 'retorno',
      title: 'Retorno',
      color: '#FFC107',
      duration: 30
    },
    'procedimento': {
      id: 'procedimento',
      title: 'Procedimento',
      color: '#FF5722',
      duration: 90
    },
    'outro': {
      id: 'outro',
      title: 'Outro',
      color: '#673AB7',
      duration: 60
    }
  };
};

export const TIPOS_SERVICO = obterTiposServico();

export const formatarEventos = (agendamentos) => {
  const tiposServico = obterTiposServico();
  
  return agendamentos.map(evento => {
    const tipoServico = tiposServico[evento.tipoServicoId || evento.tipo || 'outro'] || {
      color: '#673AB7',
      duration: 60
    };
    
    return {
      id: evento.id,
      title: evento.titulo,
      start: `${evento.data}T${evento.hora}`,
      end: calcularHoraTermino(evento.data, evento.hora),
      extendedProps: {
        descricao: evento.descricao || '',
        tipo: evento.tipoServicoId || evento.tipo || 'outro',
        clienteId: evento.clienteId || null,
        tipoServico: tipoServico
      },
      backgroundColor: tipoServico.color,
      borderColor: tipoServico.color,
      textColor: '#FFFFFF'
    };
  });
};

export const formatarEventosComDuracao = (agendamentos) => {
  const tiposServico = obterTiposServico();
  
  return agendamentos.map(evento => {
    const tipoServico = tiposServico[evento.tipoServicoId || evento.tipo || 'outro'] || {
      color: '#673AB7',
      duration: 60
    };
    
    const duracao = evento.duracao || tipoServico.duration || 60;
    
    return {
      id: evento.id,
      title: evento.titulo,
      start: `${evento.data}T${evento.hora}`,
      end: calcularHoraTermino(evento.data, evento.hora, duracao),
      extendedProps: {
        descricao: evento.descricao || '',
        tipo: evento.tipoServicoId || evento.tipo || 'outro',
        clienteId: evento.clienteId || null,
        duracao: duracao,
        tipoServico: tipoServico
      },
      backgroundColor: tipoServico.color,
      borderColor: tipoServico.color,
      textColor: '#FFFFFF'
    };
  });
};

const calcularHoraTermino = (data, horaInicio, duracaoMinutos = 60) => {
  const dataInicio = new Date(`${data}T${horaInicio}`);
  const dataFim = new Date(dataInicio.getTime() + duracaoMinutos * 60000);
  
  return dataFim.toISOString().substring(0, 16);
};

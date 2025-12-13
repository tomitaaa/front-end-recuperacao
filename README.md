descrição das HUs
instruções de instalação e execução
prints das funcionalidades
links dos PRs
link do deploy
tecnologias usadas


[HU - 001] – Filtrar compromissos por palavra-chave
Como [USUÁRIO], eu quero [PODER FILTRAR MEUS COMPROMISSOS] digitando palavras-chaves, para [ENCONTRAR MEUS AGENDAMENTOS DE FORMA MAIS ORGANIZADA E RÁPIDA].

Critérios de Aceitação:

Deve existir um campo de busca na parte superior da agenda;
A busca deve filtrar compromissos pelo título e descrição;
A filtragem deve acontecer em tempo real ou após pressionar Enter;
Caso nenhum resultado seja encontrado, exibir: “Nenhum compromisso encontrado.”;

Tarefas

Criar componente de barra de busca;
Implementar função de filtragem por título/descrição;
Implementar mensagem padrão para resultados vazios;

Story Points estimados: 3


[HU - 002] Duplicar compromisso para facilitar retorno
Como [USUÁRIO], eu quero poder [DUPLICAR MEUS COMPROMISSOS EXISTENSTES], para que assim, [POSSA SER CRIADO MAIS RAPIDAMENTE UM EVENTO SEMELHANTE, COMO UM RETORNO DE CONSULTA, SEM PRECISAR PREENCHER TUDO NOVAMENTE].

Critérios de Aceitação

Ao abrir um compromisso na agenda, ter um botão chamado “Duplicar”;
Ao clicar em “Duplicar”, deverá abrir o modal de criação já com todos os campos preenchidos com os dados do compromisso original;
A única diferença deve ser a data/hora, que podem permanecer iguais ou serem alteradas pelo usuário. Após salvar, o novo compromisso deve aparecer na agenda;
O sistema deverá impedir duplicação se houver conflito de horário, exibindo: “Conflito no horário — altere a data ou hora.”

Tarefas

Criar botão “Duplicar” no modal de visualização ou edição;
Implementar função para clonar os dados do compromisso;
Adaptar o modal de criação para receber valores pré-preenchidos;
Implementar validação de conflito antes de salvar.

Story Point estimados: 4


Como [USUÁRIO] quero poder [SELECIONAR UM CLIENTE ESPECÍFICO NA HORA DE AGENDAR A CONSULTA] para que assim seja [MAIS SIMPLES E MAIS RÁPIDO O CADASTRO DOS AGENDAMENTOS PARA CLIENTES JÁ CADASTRADOS NO SISTEMA].

Foi identificado que no momento atual do sistema, no ato de cadastrar uma nova consulta, a opção de selecionar o cliente e vincular o mesmo nessa consulta, não está funcionando, não sendo possível selecionar os clientes.

Critérios de Aceitação:


Exibir lista de todos os clientes cadastrados;

Cliente deve ser vinculado ao agendamento;

Não ser possível mais de um cliente por agendamento;
Tarefas


Corrigir carga da lista de clientes no formulário;

Permitir a inserção de um cliente no ato do agendamento.
Story Points estimados: 3

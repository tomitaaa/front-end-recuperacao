import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { AutoComplete } from "primereact/autocomplete";
import { clientesApi } from "../../utils/localStorageApi";
import "./SeletorCliente.css";

const SeletorCliente = forwardRef(
  (
    {
      selectedClientId,
      onClientSelect,
      value = null,
      onChange = null,
      required = false,
      showNewButton = true,
      showDialog = true,
    },
    ref
  ) => {
    const [clientes, setClientes] = useState([]);
    const [clienteSelecionado, setClienteSelecionado] = useState(null);
    const [clienteDialogVisivel, setClienteDialogVisivel] = useState(false);
    const [selecionarDialogVisivel, setSelecionarDialogVisivel] =
      useState(false);
    const [filteredClientes, setFilteredClientes] = useState([]);
    const [novoCliente, setNovoCliente] = useState({
      nome: "",
      telefone: "",
      email: "",
    });
    const [busca, setBusca] = useState("");

    useEffect(() => {
      carregarClientes();
    }, []);

    useImperativeHandle(ref, () => ({
      abrirModal: () => {
        carregarClientes();
        setSelecionarDialogVisivel(true);
      },
    }));

    useEffect(() => {
      // Quando o valor muda externamente (por exemplo, ao limpar formulário)
      if (value) {
        const cliente = clientes.find((cliente) => cliente.id === value);
        if (cliente) {
          setClienteSelecionado(cliente);
        }
      } else if (selectedClientId) {
        const cliente = clientes.find(
          (cliente) => cliente.id === selectedClientId
        );
        if (cliente) {
          setClienteSelecionado(cliente);
        }
      } else {
        setClienteSelecionado(null);
      }
    }, [value, selectedClientId, clientes]);

    const carregarClientes = () => {
      try {
        // Usar a API para obter os clientes
        const clientesCarregados = clientesApi.getAll();
        setClientes(clientesCarregados);
      } catch (error) {
        console.error("Erro ao carregar clientes:", error);
        setClientes([]);
      }
    };

    const handleClienteChange = (e) => {
      setClienteSelecionado(e.value);
      if (onChange) {
        onChange(e.value ? e.value.id : null);
      }
      if (onClientSelect) {
        onClientSelect(e.value ? e.value.id : null);
      }
    };

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setNovoCliente((prev) => ({
        ...prev,
        [name]: value,
      }));
    };

    const handleCriarCliente = () => {
      // Validações básicas
      if (!novoCliente.nome || !novoCliente.telefone) {
        return;
      }

      const novoId = `cliente-${Date.now()}`;
      const cliente = {
        id: novoId,
        nome: novoCliente.nome,
        telefone: novoCliente.telefone,
        email: novoCliente.email || "",
        observacoes: "",
        endereco: "",
        cidade: "",
        estado: "",
        cep: "",
        dataNascimento: "",
        genero: "",
        documentos: {
          cpf: "",
          rg: "",
        },
      };

      // Adicionar usando a API
      clientesApi.add(cliente);
      // Recarregar a lista de clientes
      const clientesAtualizados = clientesApi.getAll();
      setClientes(clientesAtualizados);

      // Selecionar o cliente recém-criado
      setClienteSelecionado(cliente);
      if (onChange) {
        onChange(cliente.id);
      }
      if (onClientSelect) {
        onClientSelect(cliente.id);
      }

      // Fechar o modal
      setClienteDialogVisivel(false);

      // Limpar o formulário
      setNovoCliente({
        nome: "",
        telefone: "",
        email: "",
      });
    };

    const abrirNovoDialog = () => {
      setNovoCliente({
        nome: "",
        telefone: "",
        email: "",
      });
      setClienteDialogVisivel(true);
    };

    const fecharDialog = () => {
      setClienteDialogVisivel(false);
    };

    // AutoComplete handler
    const buscarClientes = (event) => {
      setBusca(event.query);
      let _filteredClientes;

      if (!event.query.trim().length) {
        _filteredClientes = [...clientes];
      } else {
        const termo = event.query.toLowerCase();
        _filteredClientes = clientes.filter((cliente) => {
          return (
            cliente.nome.toLowerCase().includes(termo) ||
            cliente.telefone.includes(termo) ||
            (cliente.email && cliente.email.toLowerCase().includes(termo)) ||
            (cliente.documentos?.cpf && cliente.documentos.cpf.includes(termo))
          );
        });
      }

      setFilteredClientes(_filteredClientes);
    };

    const clienteItemTemplate = (cliente) => {
      return (
        <div className="cliente-item">
          <div>
            <span className="cliente-item-nome">{cliente.nome}</span>
            <span className="cliente-item-telefone">{cliente.telefone}</span>
          </div>
          {cliente.email && (
            <div className="cliente-item-email">{cliente.email}</div>
          )}
        </div>
      );
    };

    const clienteDialogFooter = (
      <React.Fragment>
        <Button
          label="Cancelar"
          icon="pi pi-times"
          className="p-button-text"
          onClick={fecharDialog}
        />
        <Button
          label="Salvar"
          icon="pi pi-check"
          className="p-button-text"
          onClick={handleCriarCliente}
        />
      </React.Fragment>
    );

    return (
      <div className="seletor-cliente">
        <div className="p-field p-fluid">
          <div className="p-inputgroup">
            <AutoComplete
              dropdown
              value={clienteSelecionado}
              suggestions={filteredClientes}
              completeMethod={buscarClientes}
              field="nome"
              itemTemplate={clienteItemTemplate}
              onChange={handleClienteChange}
              placeholder="Buscar cliente..."
              className={required ? "p-invalid" : ""}
              aria-required={required}
            />
            {showNewButton && (
              <Button
                icon="pi pi-plus"
                className="p-button-success"
                onClick={abrirNovoDialog}
                tooltip="Novo cliente"
              />
            )}
            <Button
              icon="pi pi-list"
              className="p-button-secondary p-ml-2"
              onClick={() => {
                carregarClientes();
                setSelecionarDialogVisivel(true);
              }}
              tooltip="Selecionar cliente"
            />
          </div>
        </div>

        {showDialog && (
          <Dialog
            visible={clienteDialogVisivel}
            style={{ width: "450px" }}
            header="Novo Cliente Rápido"
            modal
            footer={clienteDialogFooter}
            onHide={fecharDialog}
          >
            <div className="p-fluid">
              <div className="p-field">
                <label htmlFor="nome">Nome*</label>
                <InputText
                  id="nome"
                  name="nome"
                  value={novoCliente.nome}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="p-field">
                <label htmlFor="telefone">Telefone*</label>
                <InputText
                  id="telefone"
                  name="telefone"
                  value={novoCliente.telefone}
                  onChange={handleInputChange}
                  required
                  keyfilter="num"
                />
                <small>Apenas números (ex: 11987654321)</small>
              </div>
              <div className="p-field">
                <label htmlFor="email">Email</label>
                <InputText
                  id="email"
                  name="email"
                  value={novoCliente.email}
                  onChange={handleInputChange}
                />
              </div>
              <small className="p-mt-2">
                * Para adicionar mais informações do cliente, use a página
                Gerenciar Clientes.
              </small>
            </div>
          </Dialog>
        )}

        <Dialog
          header="Selecionar Cliente"
          visible={selecionarDialogVisivel}
          style={{ width: "600px" }}
          modal
          onHide={() => setSelecionarDialogVisivel(false)}
        >
          <div className="p-fluid">
            <div className="p-field">
              <InputText
                placeholder="Buscar por nome, telefone ou CPF"
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  const termo = e.target.value.toLowerCase();
                  setFilteredClientes(
                    clientes.filter(
                      (c) =>
                        (c.nome || "").toLowerCase().includes(termo) ||
                        (c.telefone || "").includes(termo) ||
                        (c.documentos?.cpf || "").includes(termo)
                    )
                  );
                }}
              />
            </div>

            <div className="lista-clientes">
              {filteredClientes.length === 0 && clientes.length === 0 && (
                <div>Nenhum cliente cadastrado.</div>
              )}
              {filteredClientes.length === 0 &&
                clientes.length > 0 &&
                clientes.map((cliente) => (
                  <div
                    key={cliente.id}
                    className="linha-cliente p-d-flex p-jc-between p-ai-center p-py-2"
                  >
                    <div>
                      <div className="cliente-nome">{cliente.nome}</div>
                      <div className="cliente-info">
                        {cliente.telefone}{" "}
                        {cliente.email && `• ${cliente.email}`}
                      </div>
                    </div>
                    <div>
                      <Button
                        label="Selecionar"
                        icon="pi pi-check"
                        className="p-button-sm"
                        onClick={() => {
                          setClienteSelecionado(cliente);
                          if (onChange) onChange(cliente.id);
                          if (onClientSelect) onClientSelect(cliente.id);
                          setSelecionarDialogVisivel(false);
                        }}
                      />
                    </div>
                  </div>
                ))}

              {filteredClientes.length > 0 &&
                filteredClientes.map((cliente) => (
                  <div
                    key={cliente.id}
                    className="linha-cliente p-d-flex p-jc-between p-ai-center p-py-2"
                  >
                    <div>
                      <div className="cliente-nome">{cliente.nome}</div>
                      <div className="cliente-info">
                        {cliente.telefone}{" "}
                        {cliente.email && `• ${cliente.email}`}
                      </div>
                    </div>
                    <div>
                      <Button
                        label="Selecionar"
                        icon="pi pi-check"
                        className="p-button-sm"
                        onClick={() => {
                          setClienteSelecionado(cliente);
                          if (onChange) onChange(cliente.id);
                          if (onClientSelect) onClientSelect(cliente.id);
                          setSelecionarDialogVisivel(false);
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </Dialog>
      </div>
    );
  }
);

export default SeletorCliente;

import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { clientesApi } from "../../utils/localStorageApi";
import "./SeletorCliente.css";

const SeletorCliente = forwardRef(
  (
    {
      selectedClientId,
      onClientSelect,
      onClientCreated = null,
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
        const clientesCarregados = clientesApi.getAll();
        setClientes(clientesCarregados);
      } catch (error) {
        console.error("Erro ao carregar clientes:", error);
        setClientes([]);
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

      clientesApi.add(cliente);
      const clientesAtualizados = clientesApi.getAll();
      setClientes(clientesAtualizados);

      setClienteSelecionado(cliente);
      if (onChange) {
        onChange(cliente.id);
      }
      if (onClientSelect) {
        onClientSelect(cliente.id);
      }
      if (onClientCreated) {
        onClientCreated(cliente);
      }

      setClienteDialogVisivel(false);
      setSelecionarDialogVisivel(false);

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

    const selecionarDialogFooter = (
      <div className="p-d-flex p-jc-between p-ai-center">
        <Button
          label="Novo Cliente"
          icon="pi pi-plus"
          className="p-button-success p-button-sm"
          onClick={() => {
            setSelecionarDialogVisivel(false);
            abrirNovoDialog();
          }}
        />
        <Button
          label="Fechar"
          icon="pi pi-times"
          className="p-button-text"
          onClick={() => setSelecionarDialogVisivel(false)}
        />
      </div>
    );

    return (
      <div className="seletor-cliente">
        <div className="p-field p-fluid">
          {clienteSelecionado ? (
            <div className="cliente-selecionado-display">
              <div className="cliente-info">
                <strong>{clienteSelecionado.nome}</strong>
                <small>{clienteSelecionado.telefone}</small>
              </div>
              <Button
                icon="pi pi-times"
                className="p-button-text p-button-sm"
                onClick={() => {
                  setClienteSelecionado(null);
                  if (onChange) onChange(null);
                  if (onClientSelect) onClientSelect(null);
                }}
                tooltip="Remover cliente"
              />
            </div>
          ) : (
            <Button
              label="Selecionar Cliente"
              icon="pi pi-user"
              className="p-button-outlined"
              onClick={() => {
                carregarClientes();
                setSelecionarDialogVisivel(true);
              }}
              style={{ width: "100%" }}
            />
          )}
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
          footer={selecionarDialogFooter}
          onHide={() => setSelecionarDialogVisivel(false)}
        >
          <div className="p-fluid">
            <div className="p-field">
              <InputText
                placeholder="Buscar por nome, telefone ou CPF"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>

            <div className="lista-clientes">
              {clientes.length === 0 && <div>Nenhum cliente cadastrado.</div>}
              {clientes
                .filter((c) => {
                  const termo = busca.toLowerCase();
                  if (!termo) return true;
                  return (
                    (c.nome || "").toLowerCase().includes(termo) ||
                    (c.telefone || "").includes(termo) ||
                    (c.documentos?.cpf || "").includes(termo)
                  );
                })
                .map((cliente) => (
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

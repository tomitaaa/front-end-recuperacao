import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { useEffect } from "react";
import "./App.css";
import Header from "./components/header/header";
import Home from "./pages/home/home";
import Footer from "./components/footer/footer";
import CadastroUsuario from "./pages/cadastroUsuario/cadastroUsuario";
import LoginUsuario from "./pages/loginUsuario/loginUsuario";
import Agendamento from "./pages/agendamento/agendamento";
import RecuperacaoSenha from "./pages/recuperacaoSenha/recuperacaoSenha";
import GerenciarServicos from "./pages/gerenciarServicos/gerenciarServicos";
import GerenciarClientes from "./pages/gerenciarClientes/gerenciarClientes";
import RelatorioGastos from "./pages/relatorioGastos/relatorioGastos";
import Perfil from "./pages/perfil/perfil";
import TesteEmail from "./pages/testeEmail/testeEmail";
import GerenciarUnificacoes from "./pages/gerenciarUnificacoes/gerenciarUnificacoes";
import HistoricoUnificacoes from "./pages/historicoUnificacoes/historicoUnificacoes";
import { PrimeReactProvider } from 'primereact/api';
import { inicializarDadosTeste } from "./utils/testDataManager";
import { inicializarSistemaLembretes, processarLembretesPendentes } from "./utils/lembretesEmailUtils";

function App() {
  useEffect(() => {
    // Inicializar dados de teste
    inicializarDadosTeste();
    
    // Inicializar sistema de lembretes (limpa lembretes antigos)
    inicializarSistemaLembretes();
    
    // Processar lembretes pendentes imediatamente
    processarLembretesPendentes().then(resultado => {
      if (resultado.total > 0) {
        console.log(`📧 Processamento de lembretes: ${resultado.enviados} enviados, ${resultado.falhas} falhas`);
      }
    });
    
    // Configurar verificação periódica de lembretes (a cada 15 minutos)
    const intervaloVerificacao = setInterval(() => {
      processarLembretesPendentes().then(resultado => {
        if (resultado.total > 0) {
          console.log(`📧 Verificação periódica: ${resultado.enviados} lembretes enviados`);
        }
      });
    }, 15 * 60 * 1000); // 15 minutos em milissegundos
    
    // Limpar intervalo ao desmontar o componente
    return () => {
      clearInterval(intervaloVerificacao);
    };
  }, []);

  return (
    <PrimeReactProvider value={{
      ripple: true,
      inputStyle: 'outlined',
      buttonStyle: 'outlined',
      hideOverlaysOnDocumentScrolling: false
    }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginUsuario />} />
          <Route path="/recuperar-senha" element={<RecuperacaoSenha />} />
          <Route path="/cadastroUsuario" element={<CadastroUsuario />} />
          
          {/* Rotas com Header */}
          <Route path="/home" element={<><Header nome="Organize Agenda" /><Home /></>} />
          <Route path="/agendamento" element={<><Header nome="Organize Agenda" /><Agendamento /></>} />
          <Route path="/servicos" element={<><Header nome="Organize Agenda" /><GerenciarServicos /></>} />
          <Route path="/clientes" element={<><Header nome="Organize Agenda" /><GerenciarClientes /></>} />
          <Route path="/relatorio-gastos" element={<><Header nome="Organize Agenda" /><RelatorioGastos /></>} />
          <Route path="/perfil" element={<><Header nome="Organize Agenda" /><Perfil /></>} />
          <Route path="/teste-email" element={<><Header nome="Organize Agenda" /><TesteEmail /></>} />
          <Route path="/unificacoes" element={<><Header nome="Organize Agenda" /><GerenciarUnificacoes /></>} />
          <Route path="/historico-unificacoes" element={<><Header nome="Organize Agenda" /><HistoricoUnificacoes /></>} />
        </Routes>
      </BrowserRouter>
      <Footer />
    </PrimeReactProvider>
  );
}

export default App;

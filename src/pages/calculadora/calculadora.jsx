import React, { useState } from "react";
import "./calculadora.css";

const Calculadora = () => {
  const [valor1, setValor1] = useState("");
  const [valor2, setValor2] = useState("");
  const [operador, setOperador] = useState("");
  const [resultado, setResultado] = useState("");

  const calcular = () => {
    const v1 = parseFloat(valor1);
    const v2 = parseFloat(valor2);
    if (isNaN(v1) || isNaN(v2)) {
      return setResultado("Valores Inválidos");
    }
    switch (operador) {
      case "+":
        setResultado(v1 + v2);
        break;
      case "-":
        setResultado(v1 - v2);
        break;
      case "*":
        setResultado(v1 * v2);
        break;
      case "/":
        setResultado(v2 !== 0 ? v1 / v2 : "Divisão por 0");
        break;
      default:
        setResultado("Operador Inválido");
    }
  };

  return (
    <div>
      {" "}
      Valor 1:
      <input value={valor1} onChange={(e) => setValor1(e.target.value)} />
      <br></br>
      Valor 2:
      <input value={valor2} onChange={(e) => setValor2(e.target.value)} />
      <br></br>
      Operador:
      <input value={operador} onChange={(e) => setOperador(e.target.value)} />
      <br></br>
      <button onClick={() => calcular()}>Calcular</button> <br />
      {true && resultado}
    </div>
  );
};

export default Calculadora;

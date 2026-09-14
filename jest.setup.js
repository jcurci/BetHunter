// `MaskedView` é nativo e não renderiza sob o jsdom/RN mock do Jest. O contador
// usa a máscara só para pintar o gradiente por cima do texto, então devolver os
// filhos preserva exatamente o que os testes precisam ler: o número e a unidade.
jest.mock('@react-native-masked-view/masked-view', () => {
  const React = require('react');
  return ({ children }) => React.createElement(React.Fragment, null, children);
});

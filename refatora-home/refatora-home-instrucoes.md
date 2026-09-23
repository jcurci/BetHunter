```
Você é um engenheiro React Native sênior especializado em refatoração de UI e animações.

Quero refatorar a tela Home existente deste projeto para que ela reproduza com ALTA FIDELIDADE o novo design fornecido nas imagens anexadas.

IMPORTANTE:
- NÃO gere imagens.
- NÃO substitua o design por uma interpretação própria.
- As imagens anexadas são a referência visual principal.
- Antes de planejar qualquer alteração, inspecione a implementação atual, estrutura de componentes, estilos, assets, dependências e sistema de navegação.
- Quero um plano de implementação preciso e depois a execução das alterações no código.
- Preserve a arquitetura existente sempre que possível, evitando refatorações não relacionadas à Home.

## REFERÊNCIAS VISUAIS

As imagens se encontram na pasta :

1. `tela_atual.jpeg`
   - Estado atual da Home.
   - Use para entender a implementação existente e identificar o que precisa ser substituído.

2. `homerefatorada_tempo.png`
   - DESIGN FINAL desejado.
   - Estado da Home mostrando o contador de tempo sem apostar.

3. `homerefatorada_transição.png`
   - REFERÊNCIA DA TRANSIÇÃO.
   - Mostra o estado intermediário quando a barra chega ao limite e o conteúdo está transitando entre os indicadores.

4. `homerefatorada_valor.png`
   - DESIGN FINAL desejado.
   - Estado da Home mostrando o valor economizado.
   
5. `bettyIdle.svg`
   - loop em SVG do pet.

As imagens 2 e 4 são as referências principais de layout.
A imagem 3 é referência específica para o comportamento da transição.

==================================================
OBJETIVO
==================================================

Refatorar a Home para ficar visualmente o mais próxima possível das imagens 2 e 4.

Não quero apenas alterar cores ou alguns espaçamentos. É necessário revisar completamente a composição visual da tela:

- distribuição de TODOS os elementos;
- espaçamentos;
- alinhamentos;
- tamanhos;
- hierarquia visual;
- tipografia;
- cards;
- botões;
- taskbar/navigation bar;
- gradientes;
- sombras;
- bordas;
- iluminação;
- efeitos de liquid glass;
- pet Betty;
- contador;
- barra de progresso/transição;
- carrossel;
- novos elementos presentes no design mas ausentes atualmente.

A implementação deve ser responsiva para diferentes tamanhos de tela, mas o resultado visual deve permanecer fiel às referências.

==================================================
1. HEADER / USUÁRIO
==================================================

O header deve seguir o design novo.

Atualmente o nome completo do usuário aparece.

ALTERAR:
- Mostrar SOMENTE o primeiro nome do usuário.
- Nunca exibir o username/nome completo nesse local.
- Não hardcodar "Jhon Doe".
- Extrair o primeiro nome dinamicamente da informação já existente no projeto.

Exemplo:

"Jhon Doe" → "Jhon"
"Fernando De Lima Magalhães" → "Fernando"

Preservar os indicadores existentes no canto superior direito, porém reproduzir exatamente sua posição, tamanho, espaçamento e aparência conforme o novo design.

==================================================
2. GRADIENTE PRINCIPAL
==================================================

Substituir o gradiente visual atual pelo novo gradiente:

#5026C7 — 0%
#DE57DF — 33%
#E07085 — 66%
#FF4C33 — 100%

IMPORTANTE:
O novo gradiente é mais saturado.

Não simplesmente aplique o gradiente a tudo.
Analise as imagens para determinar onde o gradiente é utilizado:

- textos;
- progress bar;
- bordas;
- glow;
- elementos de destaque;
- iluminação dos componentes.

O resultado deve preservar a linguagem visual do design.

==================================================
3. LIQUID GLASS / ILUMINAÇÃO
==================================================

Adicionar os efeitos visuais presentes no design novo.

Principalmente:

- botões;
- cards;
- taskbar;
- elementos circulares;
- controles;
- componentes que possuem borda iluminada.

Quero uma aparência de "liquid glass":

- superfícies escuras/translúcidas;
- leve transparência;
- bordas sutis;
- highlights;
- glow colorido;
- gradiente/reflexo;
- profundidade;
- sombras suaves.

NÃO criar um efeito exagerado.

O efeito deve parecer parte integrante do design.

Evitar:
- bordas brancas duras;
- sombras pretas pesadas;
- componentes visualmente chapados;
- transições abruptas.

Se blur/backdrop blur não for viável no ambiente React Native atual, reproduza visualmente o efeito através de camadas, transparência, gradients, shadows e overlays.

Não adicionar dependências sem necessidade.

==================================================
4. BETTY / PET
==================================================

Adicionar a Betty exatamente na região mostrada no design.

Existe UMA animação SVG em loop dentro da pasta do projeto.

Antes de implementar:
- procure o asset existente;
- identifique o formato;
- identifique como SVG animado está sendo utilizado no projeto;
- reutilize a infraestrutura existente se houver.

A Betty deve:
- aparecer centralizada na área indicada pelo design;
- manter proporção;
- ter tamanho equivalente ao da referência;
- executar continuamente o loop da animação;
- não causar layout shift;
- funcionar de maneira consistente em diferentes resoluções.

Não criar uma nova ilustração.
Não substituir por emoji.
Não usar outra animação.

==================================================
5. CONTADOR / ESTADO PRINCIPAL
==================================================

A área central possui dois estados:

ESTADO A:
"Você está livre de apostas por:"
"33 dias"

ESTADO B:
"Você já economizou:"
"15.672,00"

Esses estados devem alternar automaticamente.

Não quero uma troca abrupta.

Criar uma transição visual suave entre eles.

==================================================
6. ANIMAÇÃO DO CONTADOR
==================================================

A referência da imagem 3 mostra o conceito da transição.

Existe uma barra horizontal abaixo do contador.

Essa barra deve funcionar como indicador contínuo do ciclo.

Comportamento esperado:

1. O estado atual permanece visível.
2. A barra começa em aproximadamente 0%.
3. A barra progride continuamente.
4. Enquanto progride, o estado atual permanece estável.
5. Ao atingir 100%, iniciar uma transição suave.
6. O conteúdo deve desaparecer/transformar-se de maneira fluida.
7. O próximo estado aparece.
8. A barra reinicia.
9. O ciclo continua indefinidamente.

A transição NÃO precisa reproduzir exatamente o blur da imagem 3.

Pode utilizar uma combinação de:
- opacity;
- translateY;
- scale;
- blur, se disponível;
- interpolação;
- gradient;
- máscara;
- spring/timing animation.

Mas deve parecer suave e premium.

NÃO fazer:
- troca instantânea;
- flicker;
- salto de layout;
- mudança brusca de altura;
- animação excessivamente chamativa.

Idealmente, a animação deve dar a sensação de que o conteúdo está "fluindo" de um estado para outro.

A duração do ciclo deve ser configurável em uma constante, para que possa ser ajustada posteriormente sem alterar a lógica.

==================================================
7. PROGRESS BAR
==================================================

Reproduzir a barra mostrada nas imagens.

Características:

- pequena;
- centralizada;
- horizontal;
- cantos arredondados;
- gradiente;
- glow discreto;
- animação contínua;
- acompanha o ciclo do contador.

Utilizar:

#5026C7
→ #DE57DF
→ #E07085
→ #FF4C33

A barra não deve parecer uma progress bar convencional de formulário.
Ela faz parte da linguagem visual da Home.

==================================================
8. BOTÕES DE AÇÃO
==================================================

Reproduzir os quatro controles mostrados no novo design:

- Bloqueador
- Resetar
- Meditar
- Suporte

IMPORTANTE:
O projeto já utiliza ícones da biblioteca `reactnative-icons`.

CONTINUAR utilizando essa biblioteca.

Não substituir os ícones existentes por SVGs ou imagens desnecessariamente.

Os botões devem reproduzir:
- tamanho;
- formato circular;
- espaçamento;
- bordas;
- glow;
- iluminação;
- posição;
- tipografia;
- hierarquia.

==================================================
9. CARDS / CARROSSEL
==================================================

O novo design possui uma área com três cards grandes:

- Minha Conta
- Meu Acessor
- Menu Educacional

Abaixo deles existem três indicadores circulares.

Esses elementos representam um carrossel.

Novamente, o app utiliza a lib do reactive native icons, não substituir os icones desses cards por SVGs ou outros icones desnecessários.

O único ícone específico será o ícone do card "Minha Conta", pois este contém a logo do app.

Para o este card:
- criar apenas um mock/place-holder compatível com o layout;
- deixar o ponto de integração claramente identificado;
- NÃO tentar criar a arte final;
- vou adicionar o asset manualmente posteriormente.

ATENÇÃO:

Atualmente o aplicativo ainda não possui conteúdo real para as outras páginas.

Mesmo assim, o carrossel precisa ser MOCKADO.

Implementar exatamente 3 páginas/estados de carrossel, correspondentes aos 3 estados representados pelo design.

Não é necessário criar funcionalidades completas para esses cards.

É necessário:
- criar os três estados;
- permitir a troca entre eles;
- atualizar as bolinhas;
- manter a mesma composição visual;
- deixar a arquitetura preparada para substituir os mocks por conteúdo real futuramente.

Os três estados devem existir mesmo que atualmente só haja conteúdo real para a Home.

Não inventar novos designs além dos apresentados.

==================================================
10. INDICADORES DO CARROSSEL
==================================================

Reproduzir as três bolinhas abaixo dos cards.

O indicador ativo deve possuir o tratamento visual correspondente ao design.

Os indicadores devem mudar de acordo com a página atual.

A interação deve ser suave.

Se o projeto já possui alguma biblioteca de animação, reutilizá-la.

==================================================
11. SEÇÃO "ESTUDE"
==================================================

Reproduzir a seção inferior exatamente como no design:

"Estude"
"Continue onde parou"

E o card:

"Fundamentos"
"1/4"

com o botão/indicador de navegação no lado direito.

Revisar completamente:
- posição;
- largura;
- altura;
- border radius;
- background;
- glow;
- tipografia;
- padding;
- ícone;
- alinhamento.

Essa seção deve redirecionar o usuario pro ultimo modulo/curso jogado pelo mesmo. Caso não identifique esse serviço no projeto, deixe o botão mockado.

==================================================
12. TASKBAR / BOTTOM NAVIGATION
==================================================

A barra inferior deve ser completamente ajustada ao novo design.

Ela deve possuir aparência liquid glass.

Reproduzir:
- formato;
- altura;
- margens laterais;
- radius;
- background;
- translucidez;
- glow;
- ícones;
- estado ativo;
- espaçamento;
- labels quando aplicável.

Não tratar como uma simples tab bar padrão.

Ela é parte importante da identidade visual.

Manter a navegação funcional existente.

==================================================
13. LAYOUT
==================================================

Este é um dos pontos MAIS IMPORTANTES.

Não fazer apenas pequenos ajustes de margin/padding.

Recalcular a composição vertical inteira da tela.

Considerar:

- safe area;
- header;
- pet;
- contador;
- progress bar;
- controles;
- cards;
- indicadores;
- seção Estude;
- bottom navigation.

Todos os elementos precisam estar visualmente distribuídos como nas referências.

Evitar:
- conteúdo comprimido;
- espaços vazios inesperados;
- sobreposição;
- elementos desalinhados;
- scroll desnecessário;
- bottom bar cobrindo conteúdo.

A Home deve funcionar em diferentes tamanhos de dispositivos.

==================================================
14. RESPONSIVIDADE
==================================================

Não usar posições absolutas excessivamente para "desenhar" a tela.

Usar:
- flexbox;
- Dimensions/useWindowDimensions;
- SafeArea;
- espaçamentos relativos;
- componentes reutilizáveis.

Posições absolutas podem ser usadas quando fizerem sentido para elementos decorativos ou overlays.

A prioridade é reproduzir a referência sem transformar o layout em algo frágil.

==================================================
15. ANIMAÇÕES
==================================================

Antes de instalar qualquer biblioteca, verificar o que já existe no projeto.

Preferir:
- React Native Animated;
- Reanimated, se já estiver instalado;
- APIs existentes.

As animações devem ser:
- suaves;
- performáticas;
- sem bloquear a UI;
- sem causar re-renderizações desnecessárias.

A animação do contador deve rodar continuamente.

O pet também deve continuar em loop.

==================================================
16. ARQUITETURA
==================================================

Antes de alterar:

1. Localize o componente da Home.
2. Localize seus estilos.
3. Localize os componentes reutilizáveis.
4. Localize o sistema de cores.
5. Localize os assets.
6. Localize a implementação da navegação inferior.
7. Localize o modelo/dados utilizados para o nome do usuário.
8. Localize a implementação atual do contador.
9. Localize dependências de animação.
10. Verifique se existem componentes de Button/Card/Icon que possam ser reutilizados.

Não duplicar lógica que já existe.

Se a Home estiver monolítica, pode separar componentes como:

- HomeHeader
- Betty
- SavingsCounter
- CounterProgress
- QuickActions
- HomeCarousel
- StudyCard
- BottomNavigation

Mas só faça essa divisão se ela melhorar a manutenção.

==================================================
17. PRECISÃO VISUAL
==================================================

Use as imagens anexadas como fonte visual primária.

Compare cuidadosamente:

- coordenadas relativas;
- proporções;
- tamanhos;
- distância entre elementos;
- peso visual;
- contraste;
- cores;
- gradientes;
- bordas;
- sombras;
- glow;
- tipografia;
- alinhamentos.

Não assumir que o layout atual está correto.

O objetivo é que, ao colocar um screenshot da implementação lado a lado com as imagens 2 e 4, a diferença visual seja mínima.

==================================================
18. DADOS / MOCKS
==================================================

Não alterar backend ou modelos de dados sem necessidade.

Para o carrossel, utilizar dados mockados locais.

Exemplo conceitual:

carouselPages = [
  { ...MinhaConta },
  { ...MeuAcessor },
  { ...MenuEducacional }
]

A arquitetura deve permitir trocar esses mocks por dados reais posteriormente.

==================================================
19. RESULTADO ESPERADO
==================================================

Ao final, a Home deve possuir:

- novo layout;
- novo gradiente;
- novo sistema visual;
- liquid glass;
- iluminação;
- Betty animada;
- primeiro nome do usuário;
- indicadores;
- contador de tempo;
- contador de economia;
- transição suave entre contadores;
- progress bar animada;
- quatro ações;
- ícone bethunter mockado;
- carrossel com 3 páginas mockadas;
- indicadores do carrossel;
- seção Estude;
- nova bottom navigation;
- responsividade;
- preservação da funcionalidade existente.

==================================================
20. PROCESSO OBRIGATÓRIO
==================================================

ANTES DE ESCREVER CÓDIGO:

Faça uma inspeção completa do projeto.

Depois apresente um PLAN detalhado contendo:

1. arquivos que serão modificados;
2. arquivos que serão criados;
3. componentes que serão alterados;
4. dependências existentes que serão reutilizadas;
5. novas dependências necessárias, se realmente houver;
6. estratégia de layout;
7. estratégia de animação;
8. estratégia para liquid glass;
9. estratégia para o carrossel;
10. estratégia para o contador;
11. localização do asset da Betty;
12. como o primeiro nome será obtido;
13. como o mock do bethunter será implementado;
14. riscos/limitações encontrados no projeto.

Não comece uma implementação especulativa antes de inspecionar o código.

Se encontrar alguma diferença entre o que descrevi e a implementação real, priorize:
1. código/arquitetura existente;
2. imagens de referência;
3. requisitos deste prompt.

Ao implementar, mantenha as mudanças focadas na Home e evite quebrar funcionalidades existentes.
```
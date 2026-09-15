## Contexto
Quero a partir dos dados disponíveis gerar imagens de forma automatizada.

A primeira que vamos gerar será uma imagem de um aniversário de casa que é mandado individualmente, pra ela só é necessário o tempo de casa e o primeiro nome. Pensei em adicionar um botão em cada PersonCard que, ao ser clicado, aciona a geração da imagem de aniversário de casa e baixa ao finalizar. as especificações do design dela estão disponíveis abaixo, fique a vontade para pedir mais informações, você tem liberdade para escolher as melhores libs para essa geração.

## Design

Tamanho da imagem: 1200px x 627px

O design foi feito originalmente no Canva, esses dados são os disponíveis lá, não sei extamente a unidades de medidas dos textos 

Composição: 
- Background da imagem disponível em 'public/background.png'
- Logo 'public/logo.png' posicionada 63px do topo e 63px da esquerda e tamanho 177px x 66px
- Título 1 posicionada 63px da base e 63px da esquerda
- O título 2 e corpo estão dentro de um shape com 662px x 475px posicionado 63px da base e 63px da direito e 63px do topo, que tem como background também o 'public/background.png' como cover criando constraste com o background principal, esse shape tem o padding de 40px em todos os lados e um gap de 20 pixels entre os elementos

O resultado final foi exportado e está disponível em 'Aniversário de casa.png'

Título 1: 
- Fonte: DM Serif Display (Italic)
- Cor: Gradiente linear de 135°: #f7a205, #f07f16, #ea5518
- Tamanho: 39,5

Título 2: 
- Fonte: Outfit (Bold)
- Cor: Gradiente linear de 135°: #f7a205, #f07f16, #ea5518
- Tamanho: 25

Corpo: 
- Fonte: Outfit
- Cor: #ffffff
- Tamanho: 18

## Textos

Title1: `Aniversário de empresa`
Title2: `Parabéns pelo seu {years}º ano na SplitC!`

### 1 ano

Body: `{fist_name}, há um ano você topou fazer parte dessa jornada. Entre aprendizados, novidades e muitos desafios, você começou a construir a sua história por aqui e deu os primeiros passos vivendo a nossa cultura.

Obrigada por fazer parte do nosso time e por se mover rápido desde o primeiro dia. Esse é só o começo da sua jornada!

Com carinho,
SplitC`

### 2 anos

Body: `Em dois anos, muita coisa muda. Hoje você já conhece nossos desafios, ajuda a encontrar caminhos e faz parte das decisões que movem a SplitC todos os dias.

{first_name}, obrigada por fazer parte do nosso time e por demonstrar ownership em tudo o que faz. Que venham muitos anos construindo essa história com a gente!

Com carinho,
SplitC`

### 3 anos

Body: `Três anos representam uma trajetória de evolução constante. Você acompanhou mudanças, compartilhou conhecimento e ajudou a elevar o nível do nosso time com a busca por excelência.

{first_name}, obrigada por fazer parte do nosso time e por crescer junto com a SplitC. Seu trabalho faz diferença todos os dias.

Com carinho,
SplitC`

### 4 anos

Body: `{first_name}, ao longo desses quatro anos, você ajudou a construir relações, fortalecer nosso jeito de trabalhar e gerar impacto para quem mais importa: nossos clientes.

Obrigada por fazer parte do nosso time e por colocar o cliente no centro de cada entrega. É muito bom ter você construindo essa história com a gente.

Com carinho,
SplitC`

### 5 anos

Body: `Cinco anos é muita história pra contar. Você acompanhou mudanças, viu a SplitC crescer e, mais importante, ajudou a construir boa parte do que somos hoje.

{first_name}, obrigada por fazer parte do nosso time e por viver nossos valores todos os dias, sempre com ownership, excelência e vontade de fazer acontecer. Bora pros próximos capítulos!

Com carinho,
SplitC`

### 6 anos

Body: `{first_name}, seis anos não acontecem por acaso. É tempo de construir confiança, criar boas histórias e deixar sua marca por onde passa.

Obrigada por fazer parte do nosso time e por seguir se movendo rápido, buscando excelência e contribuindo para que nossos clientes tenham a melhor experiência. É muito bom ter você com a gente!

Com carinho,
SplitC`

### 7 anos

Body: `Sete anos... isso é muita coisa! Você acompanhou diferentes fases da SplitC, viu muita coisa mudar e fez parte de cada uma delas.

{first_name}, obrigada por fazer parte do nosso time e por seguir construindo essa história com ownership, parceria e foco em fazer o melhor para nossos clientes. Que venham muitos anos pela frente!

Com carinho,
SplitC`

## Contexto
Agora que já temos o mecanismo de geração de imagens pronto, vamos pra próxima imagem, que vai ser todos os aniversariantes de um mês específico que é mandando ao final do mês no discord da empresa. Pensei em adicionar um botão botão embaixo do MonthPicker pra acionar a geração da imagem do mês atual. As especificações do design dela estão disponíveis abaixo, fique a vontade para pedir mais informações.

## Design

Tamanho da imagem: 1920px x 1080px

O design foi feito originalmente no Canva, esses dados são os disponíveis lá, não sei extamente a unidades de medidas dos textos 

Composição: 
- Background da imagem disponível em 'public/background-2.png' diferente do anterior, esse não tem redimensionamento, ele tem o mesmo tamanho da imagem final e é um simples cover
- Logo 'public/logo-2.png' posicionada 100px do topo e 108px da direita e tamanho 200px x 75px
- Título posicionada 100px do topo e 108px da esquerda
- Subtítulo posicionado 8px abaixo do título
- Uma listagem de cards, cada card representando um aniversariante com foto, nome, setor e tempo de casa
- Cada card tem um fundo transparente, borda de 3px no mesmo gradiente do título, padding de 20px e o tamanho do card é abraçando o conteúdo
- Dentro do card tem a foto do aniversariante com 230px x 170px e a foto dentro modo cover o nome abaixo 12px abaixo o setor 8px abaixo e o tempo de casa 8px abaixo
- O espaçamento entre cards é de aproximadamente 16px

O resultado final foi exportado e está disponível em 'Aniversário de casa.png', ele tem leves diferenças da spec

Título: 
- Fonte: DM Serif Display (Italic)
- Cor: Gradiente linear de 135°: #f7a205, #f07f16, #ea5518
- Tamanho: 40

Subtítulo: 
- Fonte: Outfit
- Cor: #ffffff
- Tamanho: 16

Nome:
- Fonte: Outfit
- Cor: #f87f06
- Tamanho: 21

Setor: 
- Fonte: Outfit (Bold)
- Cor: #ffffff
- Tamanho: 16

Tempo de casa:
- Fonte: Outfit
- Cor: #ffffff
- Tamanho: 16

## Textos

Title1: `Aniversáriantes de casa`
Title2: `Mês de {mês}/{ano}`

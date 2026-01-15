# Pharos RPG

Pharos RPG é um aplicativo móvel, desenvolvido com React Native e Expo, projetado para auxiliar em sessões de RPG de mesa. Ele oferece ferramentas tanto para Mestres de Jogo (GMs) quanto para Jogadores, facilitando a gestão de campanhas e personagens.

## 🔮 Sobre o Projeto

O aplicativo possui duas áreas principais, cada uma com funcionalidades específicas para cada tipo de usuário:

### Para Jogadores
- **Biografia:** Crie e gerencie a história e os detalhes do seu personagem.
- **Inventário:** Mantenha um registro dos itens, equipamentos e dinheiro.
- **Grimório:** Uma lista de magias e habilidades disponíveis para o personagem.
- **Combate:** Ferramentas para auxiliar durante os encontros de combate.
- **Ficha:** Acesso rápido à ficha completa do personagem.

### Para Mestres (GM)
- **Dashboard:** Um painel de controle para ter uma visão geral da campanha.
- **NPCs:** Crie e gerencie Personagens Não-Jogáveis (NPCs).
- **Combate:** Gerencie a iniciativa, pontos de vida e status dos participantes do combate.

## 🛠️ Tecnologias Utilizadas

- **React Native:** Framework para desenvolvimento de aplicativos móveis multiplataforma.
- **Expo:** Plataforma e conjunto de ferramentas para facilitar o desenvolvimento com React Native.
- **TypeScript:** Superset do JavaScript que adiciona tipagem estática.
- **Expo Router:** Sistema de roteamento e navegação baseado em arquivos para aplicativos Expo.

## 🚀 Começando

Siga estas instruções para configurar e executar o projeto em seu ambiente de desenvolvimento local.

### Pré-requisitos

- [Node.js](https://nodejs.org/) (versão LTS recomendada)
- [pnpm](https://pnpm.io/installation) (ou `npm`/`yarn` se preferir)
- [Expo Go](https://expo.dev/go) (aplicativo para Android/iOS para testar o projeto)

### Instalação

1. **Clone o repositório:**
   ```sh
   git clone <URL_DO_SEU_REPOSITORIO>
   cd pharos_rp
   ```

2. **Instale as dependências:**
   ```sh
   pnpm install
   ```

### Executando o Projeto

1. **Inicie o servidor de desenvolvimento:**
   ```sh
   pnpm start
   ```

2. Com o servidor em execução, um QR code será exibido no terminal. Use o aplicativo **Expo Go** no seu celular para escanear o QR code e carregar o aplicativo.

### Outros Scripts

- **Executar em Android:**
  ```sh
  pnpm android
  ```
- **Executar em iOS:**
  ```sh
  pnpm ios
  ```
- **Verificar o código com o linter:**
  ```sh
  pnpm lint
  ```

## 📂 Estrutura do Projeto

```
pharos_rp/
├── app/                # Telas e navegação (Expo Router)
│   ├── (gm)/           # Telas exclusivas para o Mestre
│   └── (player)/       # Telas exclusivas para o Jogador
├── assets/             # Imagens, fontes e outros arquivos estáticos
├── components/         # Componentes React reutilizáveis
├── constants/          # Constantes globais (cores, temas)
├── context/            # Provedores de Contexto React
├── data/               # Dados estáticos do sistema de RPG (classes, magias)
├── hooks/              # Hooks React customizados
└── types/              # Definições de tipos TypeScript
```
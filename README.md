# ❄️ Odin Board Game

[![Angular](https://img.shields.io/badge/Angular-19-DD0031?style=for-the-badge&logo=angular)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Multiplayer](https://img.shields.io/badge/Multiplayer-P2P-orange?style=for-the-badge)](https://peerjs.com/)

A smooth and modern digital adaptation of the famous **Odin** card game. Play tactically, discard your cards, and be the first to empty your hand in this elegant P2P version.

## ✨ Features

- 📡 **P2P Multiplayer**: Play with friends without an intermediate server thanks to **PeerJS** integration. Create a lobby with a 4-digit code and invite your opponents.
- 🃏 **Complete Rules**: 
    - Automatic management of combinations (same color or same value).
    - Descending value system (e.g., an 8 and a 2 form an 82).
    - Integrated first-turn rule.
    - Manual "Pick-up" mechanic from the center.
- 🎨 **Premium Design**: Immersive interface with an "icy" theme, using harmonious HSL color palettes and an elegant dark mode.
- 🌍 **Internationalization**: Full support for French and English (via `ngx-translate`).
- ⚡ **Performance**: Developed with the latest **Angular 19** features (Signals, Standalone Components, OnPush).

## 🚀 Installation & Development

### Prerequisites
- Node.js (v18+)
- npm

### Installation
```bash
git clone https://github.com/your-username/odin.git
cd odin
npm install
```

### Run the project
```bash
npm start
```
The application will be available at `http://localhost:4200`.

## 🛠 Tech Stack

- **Framework**: [Angular 19](https://angular.dev/)
- **State Management**: Angular Signals
- **Networking**: [PeerJS](https://peerjs.com/) (WebRTC)
- **Styling**: Vanilla CSS with CSS Variables and Flexbox/Grid
- **I18n**: `@ngx-translate/core`
- **Unit Testing**: Jasmine (Angular Default)

## 📖 Game Rules
The goal is to get rid of all your cards. Each turn, you must play a stronger combination than the previous one or pick up a card from the center to pass your turn. 
*Detailed guides in multiple languages are available at the root of the project (.pdf files).*

---
Developed with ❤️ by Quentin.

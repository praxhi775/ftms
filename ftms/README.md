# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Password reset setup (Firebase Console)

1. **Authentication > Settings > Authorized domains**: make sure `praxhi775.github.io` (and `localhost` for dev) are listed.
2. **Authentication > Templates > Password reset > Edit (pencil) > Customize action URL**: set it to
   `https://praxhi775.github.io/ftms/reset-password`
   The email link then opens the in-app reset page, which sends people to the login page after the password is changed.
3. Deploy the app (`npm run deploy`) so the `/reset-password` page exists on GitHub Pages.

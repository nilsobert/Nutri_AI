# NutriAI 👋

## Get started

1. Install dependencies
   - Go to the `Nutri_AI/nutri_ai` folder and run

     ```bash
     npm install
     ```

     It installs all dependencies specified in `package.json`.

2. Start the app
   - In the package.json you find a section called `scripts`. This section lists all custom defined run commands currently in place. Please install prettier and eslint to make this work :)
     - `start` script: formats code using `prettierrs.js` config for uniform code style and then starts the app, run with:
       ```bash
       npm start
       ```
     - `lint` script: analyzes code for potential errors, stylistic incosistencies, and other problems (e.g. unused variables) using `eslint.config.js`. Recommended for debugging or cleaning up code before committing.
       Run with:
       `bash
npm run lint
`

     - `format` script: formats code using `prettierrs.js` config for uniform code style, run with:
       ```bash
       npm run format
       ```

## Outputs

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

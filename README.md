
-----

# DeepSession - Your Personal Focus Coach

[](https://opensource.org/licenses/MIT)

DeepSession is a modern, AI-powered focus timer and session tracker designed to boost your productivity. Built with Next.js and TypeScript, it provides a seamless experience for managing focus sessions, tracking your work habits, and gaining insights into your productivity patterns.

## Features

  - **Focus Timer:** A robust, persistent timer to track your work and break intervals with precision.
  - **Session Tracking:** Log every focus session with details like title, notes, and session type.
  - **Authentication:** Secure sign-in with Google or GitHub, powered by Firebase Authentication.
  - **Data Persistence:** All your session data is securely stored in Firestore and available across devices.
  - **Productivity Analytics:** An in-depth analytics page to visualize your focus trends, including daily activity, session types, and peak productivity hours.
  - **Cross-Tab Syncing:** Your timer and session state are automatically synchronized across all open browser tabs.
  - **PWA Ready:** Install DeepSession as a Progressive Web App for a native-like experience and offline capabilities.
  - **Theming:** Switch between light and dark modes to suit your preference.

## Tech Stack

  - **Framework:** [Next.js](https://nextjs.org/) (v15) with App Router
  - **Language:** [TypeScript](https://www.typescriptlang.org/)
  - **Styling:** [Tailwind CSS](https://tailwindcss.com/) (v4)
  - **State Management:** [Zustand](https://zustand-demo.pmnd.rs/)
  - **Backend & Authentication:** [Firebase](https://firebase.google.com/) (Firestore, Authentication)
  - **UI Components:** [Shadcn/UI](https://ui.shadcn.com/)
  - **Icons:** [Lucide React](https://lucide.dev/)

## Getting Started

Follow these instructions to get a local copy up and running for development and testing purposes.

### Prerequisites

  - Node.js (v18.18.0 or later)
  - `pnpm` (or your package manager of choice: `npm`, `yarn`)

### Installation & Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/triloksh07/deepsession-v0.git
    cd deepsession-v0
    ```

2.  **Install dependencies:**

    ```bash
    pnpm install
    ```

3.  **Set up your environment variables:**

    Create a `.env.local` file in the root of the project and add your Firebase project configuration. You can get this from your Firebase project settings.

    ```
    NEXT_PUBLIC_API_KEY=your_api_key
    NEXT_PUBLIC_AUTH_DOMAIN=your_auth_domain
    NEXT_PUBLIC_PROJECT_ID=your_project_id
    NEXT_PUBLIC_STORAGE_BUCKET=your_storage_bucket
    NEXT_PUBLIC_MESSAGING_SENDER_ID=your_messaging_sender_id
    NEXT_PUBLIC_APP_ID=your_app_id
    NEXT_PUBLIC_MEASUREMENT_ID=your_measurement_id
    ```

4.  **Run the development server:**

    ```bash
    pnpm dev
    ```

Open [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) with your browser to see the result.

## Available Scripts

  - `pnpm dev`: Runs the app in development mode with Turbopack.
  - `pnpm build`: Creates an optimized production build of the app.
  - `pnpm start`: Starts the production server.
  - `pnpm lint`: Runs ESLint to check for code quality and style issues.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
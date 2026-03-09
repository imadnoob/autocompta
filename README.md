# Autocompta - AI-Powered Accounting for Hospitality

Autocompta is a premium web application designed to automate accounting tasks for hotels in Morocco. It leverages Google Gemini 1.5 Flash for document intelligence and an interactive AI agent.

## Features

- **Premium UI**: Glassmorphism design, dark mode, and smooth animations.
- **Authentication**: Secure email/password login via Supabase.
- **Document Intelligence**: Upload PDF/Images, extract data (dates, amounts, suppliers), and classify according to the Moroccan Accounting Plan.
- **AI Agent**: A persistent "Spotlight" agent bar to query your accounting data and perform actions.
- **Dashboard**: Real-time overview of uploaded documents and processing status.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Vanilla CSS (Variables, Custom Design System)
- **Database & Auth**: Supabase
- **AI Model**: Google Gemini 1.5 Flash
- **Deployment**: Docker / Google Cloud Run

## Getting Started

### Prerequisites

1.  **Node.js** 18+
2.  **Supabase Account**: Create a project and get your URL and Anon Key.
3.  **Google AI Studio Account**: Get your Gemini API Key.

### Installation

1.  Clone the repository:
    ```bash
    git clone <repo-url>
    cd autocompta
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Set up environment variables:
    Rename `.env.local.example` to `.env.local` and fill in your keys.
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
    ```

4.  Set up the Database:
    - Go to your Supabase Project -> SQL Editor.
    - Copy the contents of `supabase/schema.sql` and run it.
    - This will create the `documents` table and the `documents` storage bucket with necessary policies.

5.  Run the development server:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000).

## Deployment (Google Cloud Run)

1.  Build the Docker image:
    ```bash
    docker build -t autocompta .
    ```

2.  Run locally (optional):
    ```bash
    docker run -p 3000:3000 -e NEXT_PUBLIC_SUPABASE_URL=... autocompta
    ```

3.  Deploy to Cloud Run:
    ```bash
    gcloud run deploy autocompta --source . --region europe-west1 --allow-unauthenticated
    ```

# CSV Upload Full-Stack Application

A full-stack application built with TypeScript that allows users to upload CSV files, store the data in a database, view the data with pagination, and search through the data.

## Features

- Upload CSV files with real-time progress feedback
- Store CSV data in PostgreSQL
- View uploaded data with pagination
- Search functionality
- Responsive design
- Data validation and error handling

## Tech Stack
| Component       | Technology                        |
|-----------------|-----------------------------------|
| **Frontend**    | React 18 + TypeScript + Vite      |
| **Backend**     | Node.js 20 + Express + TypeScript |
| **Database**    | PostgreSQL 15                     |
| **Infra**       | Docker + Docker Compose           |


## Prerequisites

- Docker and Docker Compose
- Node.js (v20) and npm (for local development)

## Getting Started

### Using Docker Compose (Recommended)

1. Clone the repository:
   ```bash
   git clone https://github.com/venicephua/csv-manager.git
   ```
2. Run the docker compose file:
    ``` bash
    docker-compose up -d
    ```
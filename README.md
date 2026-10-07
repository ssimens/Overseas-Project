# TAW PROJECT A.A. 2025-2026

**Francesco Simeoni — 905512**
**Alessandro Marchiorato — 907704**

This is our project for the course **"Tecnologie e Applicazioni Web"**.

## Introduction

In this README, we provide some important information about our web application and the instructions required to run it on your device.

> **Important:** We recommend reloading the page every time you send data to the server. This is important because the application may need to retrieve updated information from the server, such as the progress of an application or updates to the timeline.

## How to run the application

### 1. Start Docker Desktop

Open **Docker Desktop**. It will start the Docker daemon required to manage the three containers used by the application.

### 2. Start the containers

Open a terminal inside the folder containing the `docker-compose.yml` file.

If this is your first time running the application, or if you have made changes to the application, run:

```bash
docker compose up --build
```

This command will rebuild the Docker images and start the three containers.

> **Note:** The build process may take approximately **80–90 seconds**.

If you have already built the containers and have not made any changes to the application, you can simply run:

```bash
docker compose up
```

This command starts the three containers without rebuilding the Docker images.

### 3. Open the web application

Once the containers are running, open your browser and go to:

```text
http://localhost:4200/login
```

### 4. Stop the application

When you want to stop and remove the three containers, run:

```bash
docker compose down
```

This command removes the containers and the associated network, while keeping the Docker images on your computer.

## Check container status

You can check the status of the containers at any time using:

```bash
docker compose ps
```

This command displays information about the containers managed by Docker Compose.

## Credentials

To test the application you can use this accounts with password:

Mario Rossi: **884102@stud.unive.it (Student)**
Giulia Loredan: **884103@stud.unive.it (Student)**
Chiara Rossi: **chiara.rossi@unive.it (Professor)**
Luca Verdi: **luca.verdi@unive.it (Professor)**
Mattia Esposito: **mattia.esposito@unive.it (Professor)**
Davide Bianchi: **davide.bianchi@unive.it (Office)**

The password for each account is: "123".
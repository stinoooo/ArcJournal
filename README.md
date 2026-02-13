<div id="top">

<!-- HEADER STYLE: CLASSIC -->
<div align="center">

<img src="ArcJournal.png" width="30%" style="position: relative; top: 0; right: 0;" alt="Project Logo"/>

# ARCJOURNAL

<em>Transform Reflection into Insight and Growth</em>

<!-- BADGES -->
<img src="https://img.shields.io/github/license/stinoooo/ArcJournal?style=flat&logo=opensourceinitiative&logoColor=white&color=0080ff" alt="license">
<img src="https://img.shields.io/github/last-commit/stinoooo/ArcJournal?style=flat&logo=git&logoColor=white&color=0080ff" alt="last-commit">
<img src="https://img.shields.io/github/languages/top/stinoooo/ArcJournal?style=flat&color=0080ff" alt="repo-top-language">
<img src="https://img.shields.io/github/languages/count/stinoooo/ArcJournal?style=flat&color=0080ff" alt="repo-language-count">

<em>Built with the tools and technologies:</em>

<img src="https://img.shields.io/badge/Express-000000.svg?style=flat&logo=Express&logoColor=white" alt="Express">
<img src="https://img.shields.io/badge/JSON-000000.svg?style=flat&logo=JSON&logoColor=white" alt="JSON">
<img src="https://img.shields.io/badge/Markdown-000000.svg?style=flat&logo=Markdown&logoColor=white" alt="Markdown">
<img src="https://img.shields.io/badge/npm-CB3837.svg?style=flat&logo=npm&logoColor=white" alt="npm">
<img src="https://img.shields.io/badge/Mongoose-F04D35.svg?style=flat&logo=Mongoose&logoColor=white" alt="Mongoose">
<img src="https://img.shields.io/badge/.ENV-ECD53F.svg?style=flat&logo=dotenv&logoColor=black" alt=".ENV">
<img src="https://img.shields.io/badge/JavaScript-F7DF1E.svg?style=flat&logo=JavaScript&logoColor=black" alt="JavaScript">
<br>
<img src="https://img.shields.io/badge/Nodemon-76D04B.svg?style=flat&logo=Nodemon&logoColor=white" alt="Nodemon">
<img src="https://img.shields.io/badge/GNU%20Bash-4EAA25.svg?style=flat&logo=GNU-Bash&logoColor=white" alt="GNU%20Bash">
<img src="https://img.shields.io/badge/Electron-47848F.svg?style=flat&logo=Electron&logoColor=white" alt="Electron">
<img src="https://img.shields.io/badge/React-61DAFB.svg?style=flat&logo=React&logoColor=black" alt="React">
<img src="https://img.shields.io/badge/Vite-646CFF.svg?style=flat&logo=Vite&logoColor=white" alt="Vite">
<img src="https://img.shields.io/badge/Axios-5A29E4.svg?style=flat&logo=Axios&logoColor=white" alt="Axios">
<img src="https://img.shields.io/badge/datefns-770C56.svg?style=flat&logo=date-fns&logoColor=white" alt="datefns">

</div>
<br>

---

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
    - [Usage](#usage)
    - [Testing](#testing)
- [Features](#features)
- [Project Structure](#project-structure)
    - [Project Index](#project-index)
- [Roadmap](#roadmap)
- [License](#license)
- [Acknowledgment](#acknowledgment)

---

## Overview

ArcJournal is a comprehensive, full-stack journaling application designed to help users reflect, track emotions, and gain insights through AI-generated summaries and rich content features. Built with Electron, React, Express, and MongoDB, it offers a seamless experience from data entry to visualization.

**Why ArcJournal?**

This project enables developers to build secure, scalable journaling and analytics tools with integrated AI summaries. The core features include:

- 🎯 **🧠 AI Weekly Summaries:** Generate insightful reflections on user entries using OpenAI's GPT-4.
- 📝 **🎨 Rich Text Editor:** Empower users to create detailed, formatted journal entries with advanced editing capabilities.
- 🔒 **🔑 Secure Authentication:** Manage user profiles, sessions, and data privacy effortlessly.
- 📊 **📈 Data Visualization:** Present emotional trends and engagement metrics through intuitive dashboards.
- 🚀 **⚙️ Automated Deployment:** Simplify hosting on Railway with in-app updates via GitHub Releases.

---

## Features

|      | Component       | Details                                                                                     |
| :--- | :-------------- | :------------------------------------------------------------------------------------------ |
| ⚙️  | **Architecture**  | <ul><li>Electron-based desktop app with React frontend</li><li>Node.js backend server</li><li>Modular structure separating client and server codebases</li></ul> |
| 🔩 | **Code Quality**  | <ul><li>Uses ESLint for linting</li><li>Consistent code style with Prettier</li><li>TypeScript types are not explicitly used, relies on JavaScript</li></ul> |
| 📄 | **Documentation** | <ul><li>Basic README with project overview</li><li>In-code comments present but minimal</li><li>No dedicated API or developer docs</li></ul> |
| 🔌 | **Integrations**  | <ul><li>Electron for desktop packaging</li><li>React and React Router for UI routing</li><li>MongoDB via Mongoose for data storage</li><li>JWT for authentication</li><li>Electron-updater for auto-updates</li><li>Vite as build tool for React</li></ul> |
| 🧩 | **Modularity**    | <ul><li>Client and server code separated in different directories</li><li>Uses npm scripts for build and start commands</li><li>Component-based React architecture</li></ul> |
| 🧪 | **Testing**       | <ul><li>No explicit testing framework detected in codebase</li><li>Potential for future Jest or Cypress integration</li></ul> |
| ⚡️  | **Performance**   | <ul><li>Vite provides fast hot module replacement</li><li>Electron's native modules optimize desktop performance</li></ul> |
| 🛡️ | **Security**      | <ul><li>Uses bcryptjs for password hashing</li><li>JWT tokens for auth, stored securely</li><li>Basic CORS setup in server</li></ul> |
| 📦 | **Dependencies**  | <ul><li>Heavy reliance on Electron, React, and Node.js packages</li><li>Includes numerous Tiptap extensions for rich text editing</li><li>Build tools like @electron-forge and electron-updater</li></ul> |

---

## Project Structure

```sh
└── ArcJournal/
    ├── DEPLOYMENT.md
    ├── Procfile
    ├── README.md
    ├── client
    │   ├── index.html
    │   ├── package-lock.json
    │   ├── package.json
    │   ├── public
    │   ├── src
    │   └── vite.config.js
    ├── electron
    │   ├── main.js
    │   └── preload.js
    ├── package-lock.json
    ├── package.json
    ├── railway.json
    ├── server
    │   ├── helpers
    │   ├── index.js
    │   ├── middleware
    │   ├── models
    │   ├── package-lock.json
    │   ├── package.json
    │   └── routes
    └── setup.sh
```

---

### Project Index

<details open>
	<summary><b><code>ARCJOURNAL/</code></b></summary>
	<!-- __root__ Submodule -->
	<details>
		<summary><b>__root__</b></summary>
		<blockquote>
			<div class='directory-path' style='padding: 8px 0; color: #666;'>
				<code><b>⦿ __root__</b></code>
			<table style='width: 100%; border-collapse: collapse;'>
			<thead>
				<tr style='background-color: #f8f9fa;'>
					<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
					<th style='text-align: left; padding: 8px;'>Summary</th>
				</tr>
			</thead>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/main/README.md'>README.md</a></b></td>
					<td style='padding: 8px;'>- Provides core functionality for managing user authentication, journal entries, and weekly AI-generated summaries within the ArcJournal desktop app<br>- Integrates backend API endpoints with frontend components to enable secure, seamless journaling, search, and data visualization features, supporting the overall architecture of a full-stack Electron, React, Express, and MongoDB environment.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/main/DEPLOYMENT.md'>DEPLOYMENT.md</a></b></td>
					<td style='padding: 8px;'>- Provides comprehensive deployment and update procedures for ArcJournal, enabling hosting on Railway with MongoDB integration and automating in-app updates via GitHub Releases<br>- Facilitates seamless code deployment, environment configuration, and user update delivery, ensuring reliable backend operation and streamlined distribution for end-users.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/main/railway.json'>railway.json</a></b></td>
					<td style='padding: 8px;'>- Defines the deployment configuration for the project, specifying build and runtime instructions within the Railway platform<br>- It ensures the server is correctly built using NIXPACKS, installs dependencies, and manages server startup with automatic retries on failure<br>- This setup facilitates reliable deployment and operation of the backend service within the overall architecture.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/main/package.json'>package.json</a></b></td>
					<td style='padding: 8px;'>- Defines project metadata, dependencies, and build scripts for ArcJournal, an Electron-based personal journaling application within the ArcNode Network<br>- Facilitates development, packaging, and publishing workflows, ensuring seamless integration of server, client, and Electron components<br>- Serves as the central configuration point that orchestrates the applications lifecycle and distribution across multiple platforms.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/main/setup.sh'>setup.sh</a></b></td>
					<td style='padding: 8px;'>- Facilitates initial project setup by automating environment validation, dependency installation, and asset configuration for ArcJournal<br>- Ensures necessary environment variables and assets are in place, streamlining onboarding and preparation for development or deployment<br>- This script integrates core components of the architecture, aligning server, client, and assets to support a seamless development experience.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/main/Procfile'>Procfile</a></b></td>
					<td style='padding: 8px;'>- Defines the command to launch the web server by navigating to the server directory and executing the Node.js application<br>- It orchestrates the startup process within the deployment environment, ensuring the backend service is initiated correctly as part of the overall architecture<br>- This setup facilitates seamless deployment and operation of the web application.</td>
				</tr>
			</table>
		</blockquote>
	</details>
	<!-- server Submodule -->
	<details>
		<summary><b>server</b></summary>
		<blockquote>
			<div class='directory-path' style='padding: 8px 0; color: #666;'>
				<code><b>⦿ server</b></code>
			<table style='width: 100%; border-collapse: collapse;'>
			<thead>
				<tr style='background-color: #f8f9fa;'>
					<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
					<th style='text-align: left; padding: 8px;'>Summary</th>
				</tr>
			</thead>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/main/server/package.json'>package.json</a></b></td>
					<td style='padding: 8px;'>- Defines the core API server for ArcJournal, facilitating user authentication, data management, and secure communication<br>- It orchestrates the backend services, manages dependencies, and provides the entry point for running the application, ensuring seamless interaction between clients and the database<br>- This setup forms the backbone of the applications architecture, enabling scalable and secure journal management functionalities.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/main/server/index.js'>index.js</a></b></td>
					<td style='padding: 8px;'>- Establishes the core server infrastructure for the ArcJournal API, managing HTTP request routing, middleware configuration, and database connectivity<br>- Facilitates communication between clients and backend services, handles user authentication, journal entries, and statistics, while ensuring server health and stability<br>- Serves as the central orchestrator that enables seamless interaction and data persistence within the applications architecture.</td>
				</tr>
			</table>
			<!-- middleware Submodule -->
			<details>
				<summary><b>middleware</b></summary>
				<blockquote>
					<div class='directory-path' style='padding: 8px 0; color: #666;'>
						<code><b>⦿ server.middleware</b></code>
					<table style='width: 100%; border-collapse: collapse;'>
					<thead>
						<tr style='background-color: #f8f9fa;'>
							<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
							<th style='text-align: left; padding: 8px;'>Summary</th>
						</tr>
					</thead>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/main/server/middleware/auth.js'>auth.js</a></b></td>
							<td style='padding: 8px;'>- Implements authentication middleware to verify user identity via JSON Web Tokens, ensuring secure access control across the application<br>- It validates tokens, retrieves associated user data, and attaches it to requests, facilitating authorized interactions within the server architecture<br>- This component is essential for maintaining secure, user-specific operations throughout the codebase.</td>
						</tr>
					</table>
				</blockquote>
			</details>
			<!-- helpers Submodule -->
			<details>
				<summary><b>helpers</b></summary>
				<blockquote>
					<div class='directory-path' style='padding: 8px 0; color: #666;'>
						<code><b>⦿ server.helpers</b></code>
					<table style='width: 100%; border-collapse: collapse;'>
					<thead>
						<tr style='background-color: #f8f9fa;'>
							<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
							<th style='text-align: left; padding: 8px;'>Summary</th>
						</tr>
					</thead>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/main/server/helpers/openai.js'>openai.js</a></b></td>
							<td style='padding: 8px;'>- Facilitates the generation of weekly journal summaries by analyzing individual entries and producing structured JSON reports<br>- Integrates with OpenAIs GPT-4 to synthesize insights on emotional trends, highlights, and overall weekly reflections, supporting the applications goal of providing users with meaningful, automated summaries of their journaling activity within the broader system architecture.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/main/server/helpers/gemini.js'>gemini.js</a></b></td>
							<td style='padding: 8px;'>- Generates weekly summaries for ArcJournal by synthesizing user journal entries into a JSON report<br>- It captures key themes, emotional trends, highlights, and overall mood, providing a warm, concise overview of the week<br>- This functionality supports the applications goal of delivering personalized, insightful reflections to users, enhancing their journaling experience through automated, meaningful summaries.</td>
						</tr>
					</table>
				</blockquote>
			</details>
			<!-- models Submodule -->
			<details>
				<summary><b>models</b></summary>
				<blockquote>
					<div class='directory-path' style='padding: 8px 0; color: #666;'>
						<code><b>⦿ server.models</b></code>
					<table style='width: 100%; border-collapse: collapse;'>
					<thead>
						<tr style='background-color: #f8f9fa;'>
							<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
							<th style='text-align: left; padding: 8px;'>Summary</th>
						</tr>
					</thead>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/main/server/models/User.js'>User.js</a></b></td>
							<td style='padding: 8px;'>- Defines the user data model within the applications architecture, encapsulating user profile information, authentication credentials, and onboarding status<br>- Facilitates secure password handling through hashing and provides mechanisms for password verification and sensitive data exclusion during serialization, supporting user management, authentication, and onboarding workflows across the system.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/main/server/models/Wrap.js'>Wrap.js</a></b></td>
							<td style='padding: 8px;'>- Defines the data structure for weekly user reflections, capturing mood, grades, and activity insights<br>- Facilitates aggregation and analysis of user emotional trends, progress, and engagement over time within the broader application architecture<br>- Serves as a core component for tracking individual user journeys and generating personalized feedback.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/main/server/models/Entry.js'>Entry.js</a></b></td>
							<td style='padding: 8px;'>- Defines the data schema for journal entries within the application, capturing user-specific daily logs with rich content, comments, attachments, and version history<br>- Facilitates structured storage and retrieval of user entries, supporting features like editing, multimedia attachments, and comment threads, integral to the overall journaling and data management architecture.</td>
						</tr>
					</table>
				</blockquote>
			</details>
			<!-- routes Submodule -->
			<details>
				<summary><b>routes</b></summary>
				<blockquote>
					<div class='directory-path' style='padding: 8px 0; color: #666;'>
						<code><b>⦿ server.routes</b></code>
					<table style='width: 100%; border-collapse: collapse;'>
					<thead>
						<tr style='background-color: #f8f9fa;'>
							<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
							<th style='text-align: left; padding: 8px;'>Summary</th>
						</tr>
					</thead>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/main/server/routes/entries.js'>entries.js</a></b></td>
							<td style='padding: 8px;'>- Defines RESTful API endpoints for managing user journal entries, enabling creation, retrieval, updating, and deletion<br>- Supports filtering by date ranges and search terms, while maintaining version history for content edits<br>- Integrates authentication to ensure secure access, forming a core component of the applications data handling and user interaction architecture.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/main/server/routes/user.js'>user.js</a></b></td>
							<td style='padding: 8px;'>- Defines user-related API endpoints for profile management, onboarding completion, and account deletion within the application<br>- Facilitates updating user information, retrieving profile data, and securely deleting user accounts along with associated data, supporting seamless user lifecycle operations and ensuring data integrity across the system.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/main/server/routes/auth.js'>auth.js</a></b></td>
							<td style='padding: 8px;'>- Defines authentication routes for user registration, login, and profile retrieval within the server architecture<br>- Facilitates secure user onboarding, credential validation, and session management through JWT tokens, integrating seamlessly with user data models and middleware to support authentication workflows across the application.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/main/server/routes/wraps.js'>wraps.js</a></b></td>
							<td style='padding: 8px;'>- Provides API endpoints to generate, retrieve, and manage weekly summaries of user journal entries<br>- It calculates key metrics such as average grades, mood trends, top emojis, and day-specific insights, enabling users to review their weekly progress and emotional patterns without relying on AI<br>- Integrates seamlessly into the broader application architecture for personalized reflection and tracking.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/main/server/routes/stats.js'>stats.js</a></b></td>
							<td style='padding: 8px;'>- Provides comprehensive statistical analysis of user journal entries within specified date ranges, including word counts, mood trends, streaks, activity patterns, and engagement metrics<br>- Serves as a core component for generating insights and visualizations, supporting features like progress tracking, mood analysis, and user engagement summaries within the overall application architecture.</td>
						</tr>
					</table>
				</blockquote>
			</details>
		</blockquote>
	</details>
	<!-- electron Submodule -->
	<details>
		<summary><b>electron</b></summary>
		<blockquote>
			<div class='directory-path' style='padding: 8px 0; color: #666;'>
				<code><b>⦿ electron</b></code>
			<table style='width: 100%; border-collapse: collapse;'>
			<thead>
				<tr style='background-color: #f8f9fa;'>
					<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
					<th style='text-align: left; padding: 8px;'>Summary</th>
				</tr>
			</thead>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/main/electron/main.js'>main.js</a></b></td>
					<td style='padding: 8px;'>- Manages the main process of an Electron application, orchestrating window creation, auto-updates, secure token storage, and application lifecycle events<br>- Facilitates communication between the renderer process and system-level functionalities, ensuring seamless user experience, security, and update handling within the overall architecture.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/main/electron/preload.js'>preload.js</a></b></td>
					<td style='padding: 8px;'>- Facilitates secure communication between the Electron renderer process and main process by exposing APIs for token management, window controls, application information, and auto-updater functionalities<br>- Acts as a bridge to enable the renderer to invoke main process actions and listen for update events, ensuring a seamless and secure user experience within the applications architecture.</td>
				</tr>
			</table>
		</blockquote>
	</details>
	<!-- client Submodule -->
	<details>
		<summary><b>client</b></summary>
		<blockquote>
			<div class='directory-path' style='padding: 8px 0; color: #666;'>
				<code><b>⦿ client</b></code>
			<table style='width: 100%; border-collapse: collapse;'>
			<thead>
				<tr style='background-color: #f8f9fa;'>
					<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
					<th style='text-align: left; padding: 8px;'>Summary</th>
				</tr>
			</thead>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/main/client/package.json'>package.json</a></b></td>
					<td style='padding: 8px;'>- Defines the client-side configuration and dependencies for the ArcJournal web application, enabling a rich, interactive user interface built with React and Tiptap for advanced text editing<br>- It orchestrates development, build, and preview workflows, ensuring a seamless experience for users to create, edit, and view journal entries within the overall architecture.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/main/client/vite.config.js'>vite.config.js</a></b></td>
					<td style='padding: 8px;'>- Configures the development and build environment for the client-side application, leveraging Vite to optimize React development workflows<br>- Establishes project structure, server settings, build output, and module resolution aliases, ensuring a streamlined and efficient setup that integrates seamlessly with the overall architecture<br>- This setup facilitates rapid development and consistent deployment of the front-end interface.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/main/client/index.html'>index.html</a></b></td>
					<td style='padding: 8px;'>- Serves as the entry point for the client-side application, establishing the foundational HTML structure and loading the main React component<br>- It initializes the user interface for ArcJournal, enabling dynamic content rendering and interaction within the web browser<br>- This file integrates essential fonts and development tools, supporting a seamless user experience and development workflow.</td>
				</tr>
			</table>
			<!-- src Submodule -->
			<details>
				<summary><b>src</b></summary>
				<blockquote>
					<div class='directory-path' style='padding: 8px 0; color: #666;'>
						<code><b>⦿ client.src</b></code>
					<table style='width: 100%; border-collapse: collapse;'>
					<thead>
						<tr style='background-color: #f8f9fa;'>
							<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
							<th style='text-align: left; padding: 8px;'>Summary</th>
						</tr>
					</thead>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/main/client/src/main.jsx'>main.jsx</a></b></td>
							<td style='padding: 8px;'>- Initialize the React application by rendering the main App component into the DOM, establishing the entry point for the client-side user interface<br>- It sets up the foundational rendering process within the project architecture, ensuring that the React component tree is mounted correctly and the application is ready for user interaction.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/main/client/src/App.jsx'>App.jsx</a></b></td>
							<td style='padding: 8px;'>- Defines the client-side routing architecture, managing user authentication flow, onboarding process, and access to core application features<br>- Implements layout components that conditionally render navigation elements based on user state, ensuring seamless navigation and access control across the apps different sections<br>- Serves as the central navigation hub, orchestrating user experience and route protection within the overall application structure.</td>
						</tr>
					</table>
					<!-- context Submodule -->
					<details>
						<summary><b>context</b></summary>
						<blockquote>
							<div class='directory-path' style='padding: 8px 0; color: #666;'>
								<code><b>⦿ client.src.context</b></code>
							<table style='width: 100%; border-collapse: collapse;'>
							<thead>
								<tr style='background-color: #f8f9fa;'>
									<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
									<th style='text-align: left; padding: 8px;'>Summary</th>
								</tr>
							</thead>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/main/client/src/context/ToastContext.jsx'>ToastContext.jsx</a></b></td>
									<td style='padding: 8px;'>- Provides a centralized mechanism for managing and displaying toast notifications across the application<br>- Facilitates user feedback by showing transient success, error, or informational messages, enhancing user experience and communication within the overall architecture<br>- Integrates seamlessly with the React component hierarchy to ensure consistent, styled, and dismissible alerts.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/main/client/src/context/AuthContext.jsx'>AuthContext.jsx</a></b></td>
									<td style='padding: 8px;'>- Provides user authentication management within the application by handling login, signup, logout, and user data retrieval<br>- It maintains authentication state, manages tokens, and exposes authentication functions through context, enabling seamless access to user information and auth actions across the app<br>- This component is central to maintaining secure, persistent user sessions within the overall architecture.</td>
								</tr>
							</table>
						</blockquote>
					</details>
					<!-- utils Submodule -->
					<details>
						<summary><b>utils</b></summary>
						<blockquote>
							<div class='directory-path' style='padding: 8px 0; color: #666;'>
								<code><b>⦿ client.src.utils</b></code>
							<table style='width: 100%; border-collapse: collapse;'>
							<thead>
								<tr style='background-color: #f8f9fa;'>
									<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
									<th style='text-align: left; padding: 8px;'>Summary</th>
								</tr>
							</thead>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/main/client/src/utils/birthday.js'>birthday.js</a></b></td>
									<td style='padding: 8px;'>- Provides utility functions for handling user birthdays, including date comparisons, formatting, and age calculations, to support personalized user experiences<br>- Also offers time-based greetings and display name retrieval, enhancing user engagement and interface customization within the broader application architecture.</td>
								</tr>
							</table>
						</blockquote>
					</details>
					<!-- api Submodule -->
					<details>
						<summary><b>api</b></summary>
						<blockquote>
							<div class='directory-path' style='padding: 8px 0; color: #666;'>
								<code><b>⦿ client.src.api</b></code>
							<table style='width: 100%; border-collapse: collapse;'>
							<thead>
								<tr style='background-color: #f8f9fa;'>
									<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
									<th style='text-align: left; padding: 8px;'>Summary</th>
								</tr>
							</thead>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/main/client/src/api/index.js'>index.js</a></b></td>
									<td style='padding: 8px;'>- Provides a centralized API client for interacting with backend services, managing authentication, user profiles, entries, wraps, and statistics<br>- Facilitates secure, streamlined communication between the client application and server, handling token management and request configuration to support core functionalities like user onboarding, data entry management, and analytics within the overall architecture.</td>
								</tr>
							</table>
						</blockquote>
					</details>
					<!-- pages Submodule -->
					<details>
						<summary><b>pages</b></summary>
						<blockquote>
							<div class='directory-path' style='padding: 8px 0; color: #666;'>
								<code><b>⦿ client.src.pages</b></code>
							<table style='width: 100%; border-collapse: collapse;'>
							<thead>
								<tr style='background-color: #f8f9fa;'>
									<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
									<th style='text-align: left; padding: 8px;'>Summary</th>
								</tr>
							</thead>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/main/client/src/pages/Settings.jsx'>Settings.jsx</a></b></td>
									<td style='padding: 8px;'>- Provides a user interface for managing personal profile settings, account deletion, and data management within the application<br>- Facilitates profile updates, age calculation, and critical account actions through modals, ensuring users can customize their experience and securely delete data or their account, aligning with the overall architectures focus on user-centric account control and data privacy.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/main/client/src/pages/SignIn.jsx'>SignIn.jsx</a></b></td>
									<td style='padding: 8px;'>- Facilitates user authentication by providing a sign-in interface that captures credentials, manages login flow, and handles errors within the applications architecture<br>- Integrates with authentication and toast notification contexts to deliver a seamless user experience, enabling secure access to protected areas of the platform and supporting the overall user onboarding process.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/main/client/src/pages/Dashboard.jsx'>Dashboard.jsx</a></b></td>
									<td style='padding: 8px;'>- Provides an interactive dashboard for daily journaling, enabling users to record reflections, assign day grades, and select emojis to express their mood<br>- Incorporates birthday-specific prompts and displays relevant greetings, fostering personalized engagement<br>- Facilitates seamless entry creation and management within the broader journaling and user profile architecture, enhancing user experience through contextual prompts and celebratory features.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/main/client/src/pages/SignUp.jsx'>SignUp.jsx</a></b></td>
									<td style='padding: 8px;'>- Facilitates user account creation within the ArcJournal platform by providing a registration interface<br>- It manages form input, validates data, and interacts with authentication services to register new users<br>- Enhances user onboarding and ensures seamless account setup, integrating visual feedback and navigation to support a smooth sign-up experience in the overall application architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/main/client/src/pages/Onboarding.jsx'>Onboarding.jsx</a></b></td>
									<td style='padding: 8px;'>- Facilitates user onboarding by guiding new users through personalized profile setup, including name, birth date, gender, and journaling goals<br>- Supports a multi-step process to enhance user engagement and tailor the journaling experience, ultimately integrating user preferences into the platforms architecture for a customized and welcoming entry point into the application.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/main/client/src/pages/Journal.jsx'>Journal.jsx</a></b></td>
									<td style='padding: 8px;'>- Journal.jsxThis component serves as the primary interface for users to view, create, and manage their journal entries within the application<br>- It provides a calendar-based view of entries, enabling users to navigate through different months and select specific dates to review or add reflections<br>- Additionally, it integrates features such as emotion tagging, rich text editing, and comment management, fostering a comprehensive journaling experience<br>- Overall, Journal.jsx acts as the central hub for user self-reflection, emotional tracking, and interaction within the applications architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/main/client/src/pages/ArcWrapped.jsx'>ArcWrapped.jsx</a></b></td>
									<td style='padding: 8px;'>- The <code>ArcWrapped.jsx</code> file serves as a key component within the client-side architecture, responsible for presenting a comprehensive overview of user emotional and engagement metrics over customizable timeframes<br>- It fetches statistical data from the API, processes it, and displays it through an intuitive interface featuring dynamic visual cues such as color-coded grades and emojis<br>- This component enables users to analyze their emotional trends and activity patterns, thereby supporting the applications goal of fostering self-awareness and mental well-being<br>- Overall, it acts as an interactive dashboard that consolidates and visualizes user-centric insights within the broader analytics and user engagement architecture.</td>
								</tr>
							</table>
						</blockquote>
					</details>
					<!-- components Submodule -->
					<details>
						<summary><b>components</b></summary>
						<blockquote>
							<div class='directory-path' style='padding: 8px 0; color: #666;'>
								<code><b>⦿ client.src.components</b></code>
							<table style='width: 100%; border-collapse: collapse;'>
							<thead>
								<tr style='background-color: #f8f9fa;'>
									<th style='width: 30%; text-align: left; padding: 8px;'>File Name</th>
									<th style='text-align: left; padding: 8px;'>Summary</th>
								</tr>
							</thead>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/main/client/src/components/EmojiPicker.jsx'>EmojiPicker.jsx</a></b></td>
									<td style='padding: 8px;'>- Provides an interactive emoji-based emotion selector integrated into the user interface, enabling users to express their current feelings visually<br>- It enhances user engagement by offering a visually appealing, intuitive way to capture emotional states, supporting the broader applications goal of fostering emotional awareness and personalized interactions within the overall architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/main/client/src/components/Spinner.jsx'>Spinner.jsx</a></b></td>
									<td style='padding: 8px;'>- Provides a reusable loading indicator component that visually signifies ongoing processes within the user interface<br>- It enhances user experience by offering a consistent, customizable spinner across various parts of the application, supporting smooth and responsive interactions within the overall component architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/main/client/src/components/TitleBar.jsx'>TitleBar.jsx</a></b></td>
									<td style='padding: 8px;'>- Provides a custom title bar component for the application, adapting its appearance and controls based on the environment<br>- In Electron, it offers window management buttons styled like macOS traffic lights, enabling users to close, minimize, or maximize the window<br>- Outside Electron, it displays a simple header with the application name, ensuring consistent branding across different platforms.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/main/client/src/components/RichEditor.jsx'>RichEditor.jsx</a></b></td>
									<td style='padding: 8px;'>- RichEditor.jsxThis component provides a rich text editing interface within the application, enabling users to create, format, and annotate content dynamically<br>- It leverages the Tiptap editor framework to support a wide range of text styles, media embedding, and task management features, facilitating complex content creation workflows<br>- As a core part of the client-side architecture, it ensures a seamless and interactive editing experience, serving as the primary interface for user-generated content within the application.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/main/client/src/components/Modal.jsx'>Modal.jsx</a></b></td>
									<td style='padding: 8px;'>- Provides a reusable modal component for user interactions, enabling confirmation prompts, alerts, or dialogs within the application<br>- It integrates seamlessly into the overall architecture by offering a flexible, styled overlay that manages user focus and actions, ensuring consistent modal behavior across different parts of the user interface.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/main/client/src/components/CommentsSidebar.jsx'>CommentsSidebar.jsx</a></b></td>
									<td style='padding: 8px;'>- Provides an interactive sidebar for managing user comments within the application<br>- Enables viewing, searching, and selecting comments, highlighting active entries, and facilitating deletion<br>- Enhances user engagement by offering clear visual cues, timestamps, and contextual information, thereby supporting effective comment review and moderation as part of the overall content interaction architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/main/client/src/components/Sidebar.jsx'>Sidebar.jsx</a></b></td>
									<td style='padding: 8px;'>- Provides the sidebar navigation component for the applications user interface, enabling seamless access to main sections such as Today, Journal, Stats, and Settings<br>- It displays user information, including name and email, highlights birthdays, and facilitates user logout<br>- Integrates with authentication and routing systems to support personalized navigation within the overall architecture.</td>
								</tr>
							</table>
						</blockquote>
					</details>
				</blockquote>
			</details>
		</blockquote>
	</details>
</details>

---

## Getting Started

### Prerequisites

This project requires the following dependencies:

- **Programming Language:** JavaScript
- **Package Manager:** Npm

### Installation

Build ArcJournal from the source and install dependencies:

1. **Clone the repository:**

    ```sh
    ❯ git clone https://github.com/stinoooo/ArcJournal
    ```

2. **Navigate to the project directory:**

    ```sh
    ❯ cd ArcJournal
    ```

3. **Install the dependencies:**

**Using [npm](https://www.npmjs.com/):**

```sh
❯ npm install
```

### Usage

Run the project with:

**Using [npm](https://www.npmjs.com/):**

```sh
npm start
```

### Testing

Arcjournal uses the {__test_framework__} test framework. Run the test suite with:

**Using [npm](https://www.npmjs.com/):**

```sh
npm test
```

---

## Roadmap

- [X] **`Task 1`**: <strike>Implement feature one.</strike>
- [ ] **`Task 2`**: Implement feature two.
- [ ] **`Task 3`**: Implement feature three.

---

## License

Arcjournal is protected under the [LICENSE](https://choosealicense.com/licenses/mit/) License. For more details, refer to the [LICENSE](https://choosealicense.com/licenses/mit/) file.

---

## Acknowledgments

- Credit `contributors`, `inspiration`, `references`, etc.

<div align="left"><a href="#top">⬆ Return</a></div>

---

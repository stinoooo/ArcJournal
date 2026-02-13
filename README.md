<div id="top">

<!-- HEADER STYLE: CLASSIC -->
<div align="center">

<img src="assets/bluelogo.png" width="30%" style="position: relative; top: 0; right: 0;" alt="Project Logo"/>

# ARCJOURNAL

<em>Transform Reflection Into Insight and Growth</em>

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

---

## Overview

ArcJournal is a comprehensive platform that transforms personal reflections into meaningful insights through rich text editing, emotion tagging, and AI-powered summaries. Built with a modular architecture, it supports deployment across web, desktop, and mobile environments, making it a versatile tool for developers creating personalized journaling applications.

**Why ArcJournal?**

This project aims to streamline the development of reflective, data-driven journaling apps. The core features include:

- 🧠 **AI Insights:** Weekly summaries and emotional analysis powered by OpenAI GPT-4.
- ✍️ **Rich Content:** Advanced text editing with support for media, comments, and annotations.
- 🔒 **Secure User Management:** Authentication, profile handling, and data privacy built-in.
- 🖥️ **Cross-Platform Support:** Electron-based desktop app with seamless deployment options.
- 🚀 **Scalable Architecture:** Modular backend and frontend components designed for growth and customization.

---

## Features

|      | Component       | Details                                                                                     |
| :--- | :-------------- | :------------------------------------------------------------------------------------------ |
| ⚙️  | **Architecture**  | <ul><li>Electron-based desktop app with React frontend</li><li>Node.js backend with Express</li><li>Separation of client and server directories</li><li>Uses Vite for frontend build</li></ul> |
| 🔩 | **Code Quality**  | <ul><li>Consistent use of modern JavaScript/TypeScript syntax</li><li>Modular components with React hooks</li><li>Linting likely enforced via npm scripts</li></ul> |
| 📄 | **Documentation** | <ul><li>Basic README with project overview</li><li>Includes setup instructions and dependencies</li><li>Code comments present in key modules</li></ul> |
| 🔌 | **Integrations**  | <ul><li>Electron for desktop packaging</li><li>Electron-updater for auto-updates</li><li>React Router for navigation</li><li>Axios for HTTP requests</li><li>MongoDB via Mongoose for data storage</li></ul> |
| 🧩 | **Modularity**    | <ul><li>Separate client and server codebases</li><li>Reusable React components and hooks</li><li>Configurable via JSON files (e.g., railway.json)</li></ul> |
| 🧪 | **Testing**       | <ul><li>Testing framework not explicitly specified; likely uses Jest or similar</li><li>Potential unit tests for React components and backend APIs</li></ul> |
| ⚡️  | **Performance**   | <ul><li>Uses Vite for fast frontend builds</li><li>Electron's auto-updater optimizes update process</li><li>Code splitting and lazy loading implied via React and Vite</li></ul> |
| 🛡️ | **Security**      | <ul><li>Uses bcryptjs for password hashing</li><li>jsonwebtoken for auth tokens</li><li>Express-validator for input validation</li></ul> |
| 📦 | **Dependencies**  | <ul><li>React, Electron, Node.js, Mongoose, Axios, bcryptjs, jsonwebtoken</li><li>Build tools: Vite, Electron Forge, cross-env</li><li>UI extensions: Tiptap extensions for rich text editing</li></ul> |

---

## Project Structure

```sh
└── ArcJournal/
    ├── DEPLOYMENT.md
    ├── LICENSE
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
					<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/master/LICENSE'>LICENSE</a></b></td>
					<td style='padding: 8px;'>- Provides the core licensing information that governs the entire project, establishing legal permissions and restrictions for software use, distribution, and modification within the overall architecture<br>- Ensures clarity on licensing terms, supporting open-source collaboration and safeguarding intellectual property across the codebase.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/master/README.md'>README.md</a></b></td>
					<td style='padding: 8px;'>- The core code file in this project serves as the foundational component that orchestrates the applications primary functionality—transforming user reflections into meaningful insights and fostering personal growth<br>- It manages the flow of data, handles user interactions, and integrates various tools and technologies to deliver a seamless journaling experience<br>- Overall, this code is essential for enabling users to record, analyze, and derive value from their reflections within the ARCJOURNAL platform, supporting the projects goal of turning reflection into insight and growth.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/master/DEPLOYMENT.md'>DEPLOYMENT.md</a></b></td>
					<td style='padding: 8px;'>- Provides comprehensive deployment and update procedures for ArcJournal, enabling hosting on Railway with MongoDB integration and automating in-app updates via GitHub Releases<br>- Facilitates seamless server deployment, environment configuration, and user update delivery, ensuring reliable backend operation and streamlined release management for end-users.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/master/railway.json'>railway.json</a></b></td>
					<td style='padding: 8px;'>- Defines deployment and build configurations for the project, orchestrating the setup of the server environment using NIXPACKS<br>- Ensures automated installation of dependencies and manages server startup with restart policies, facilitating reliable deployment within the Railway platform<br>- This configuration integrates the server component into the overall architecture, supporting seamless deployment and operational stability.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/master/package.json'>package.json</a></b></td>
					<td style='padding: 8px;'>- Defines project metadata, dependencies, and build scripts for ArcJournal, an Electron-based personal journaling application within the ArcNode Network<br>- Facilitates development, packaging, and publishing workflows, ensuring seamless integration of server, client, and Electron components<br>- Serves as the central configuration point that orchestrates the apps lifecycle, build processes, and distribution across platforms.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/master/setup.sh'>setup.sh</a></b></td>
					<td style='padding: 8px;'>- Facilitates initial project setup by automating dependency installation, environment configuration, and asset placement for ArcJournal<br>- Ensures all necessary components are prepared for development or deployment, streamlining onboarding and maintaining consistency across environments within the overall architecture<br>- This script supports the seamless integration of backend, frontend, and assets, enabling efficient project initialization.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/master/Procfile'>Procfile</a></b></td>
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
					<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/master/server/package.json'>package.json</a></b></td>
					<td style='padding: 8px;'>- Defines the core API server for ArcJournal, enabling user authentication, data management, and secure communication<br>- It orchestrates request handling, integrates essential middleware, and connects to the database, forming the backbone of the applications backend architecture to support journal-related functionalities and ensure reliable, scalable service delivery.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/master/server/index.js'>index.js</a></b></td>
					<td style='padding: 8px;'>- Establishes the core backend server for ArcJournal, managing API endpoints for authentication, entries, user data, wraps, and statistics<br>- Connects to MongoDB, handles middleware configurations, and ensures server stability<br>- Facilitates communication between client applications and the database, supporting data storage, retrieval, and health monitoring within the overall architecture.</td>
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
							<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/master/server/middleware/auth.js'>auth.js</a></b></td>
							<td style='padding: 8px;'>- Implements authentication middleware to verify user identity through JWT tokens, ensuring secure access control across the application<br>- It validates tokens, retrieves associated user data, and attaches user information to requests, facilitating protected route access and maintaining overall security within the server architecture.</td>
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
							<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/master/server/helpers/openai.js'>openai.js</a></b></td>
							<td style='padding: 8px;'>- Facilitates automated weekly summaries of journal entries by leveraging OpenAIs GPT-4 model<br>- It analyzes user reflections, grades, and emotions to generate structured JSON reports highlighting weekly trends, key highlights, and emotional insights<br>- This component integrates AI-driven insights into the overall architecture, supporting personalized journaling feedback and progress tracking within the application.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/master/server/helpers/gemini.js'>gemini.js</a></b></td>
							<td style='padding: 8px;'>- Generates weekly summaries for ArcJournal by synthesizing user journal entries into a concise JSON report<br>- It captures key themes, emotional trends, highlights, and overall mood, supporting users reflection and insights<br>- This component integrates AI-driven natural language processing to produce warm, structured summaries aligned with the applications focus on emotional awareness and personal growth.</td>
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
							<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/master/server/models/User.js'>User.js</a></b></td>
							<td style='padding: 8px;'>- Defines the user data model within the applications architecture, encapsulating user identity, onboarding information, and security measures<br>- Facilitates user account management, including registration, authentication, and profile updates, while ensuring data integrity and privacy through schema validation and password hashing<br>- Serves as a foundational component for user-related functionalities across the system.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/master/server/models/Wrap.js'>Wrap.js</a></b></td>
							<td style='padding: 8px;'>- Defines the data structure for weekly user reflections, capturing mood, grades, and journaling activity<br>- Serves as a core component for aggregating and analyzing user emotional trends, progress, and engagement over time within the applications architecture<br>- Facilitates efficient storage and retrieval of personalized weekly summaries to support insights and user feedback.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/master/server/models/Entry.js'>Entry.js</a></b></td>
							<td style='padding: 8px;'>- Defines the data schema for journal entries within the application, capturing user-specific daily logs with rich content, comments, attachments, and version history<br>- Serves as the core data model for storing and retrieving user entries, enabling features like editing, commenting, and multimedia support, thereby facilitating a comprehensive journaling experience aligned with user activity and customization.</td>
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
							<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/master/server/routes/entries.js'>entries.js</a></b></td>
							<td style='padding: 8px;'>- Defines RESTful API endpoints for managing user journal entries, enabling creation, retrieval, updating, and deletion of entries<br>- Supports filtering by date ranges and search terms, maintains version history for content edits, and enforces user authentication<br>- Integrates seamlessly into the broader application architecture to facilitate personalized, date-organized journaling functionality.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/master/server/routes/user.js'>user.js</a></b></td>
							<td style='padding: 8px;'>- Defines user-related API endpoints for profile management, onboarding completion, and account deletion within the application<br>- Facilitates updating user information, retrieving user profiles, and securely deleting user data and associated entries, ensuring seamless user lifecycle handling and data integrity across the platform.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/master/server/routes/auth.js'>auth.js</a></b></td>
							<td style='padding: 8px;'>- Defines authentication routes for user registration, login, and profile retrieval within the server architecture<br>- Facilitates secure user onboarding and session management through token-based authentication, enabling seamless access control across the application<br>- Integrates validation, error handling, and middleware to ensure robust security and user data integrity.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/master/server/routes/wraps.js'>wraps.js</a></b></td>
							<td style='padding: 8px;'>- Provides API endpoints to generate, retrieve, and manage weekly summaries of user journal entries<br>- It calculates key metrics such as average grades, mood trends, top emojis, and day-specific insights, enabling users to review their weekly progress and patterns without relying on AI<br>- Integrates seamlessly into the broader application architecture for personalized reflection and tracking.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/master/server/routes/stats.js'>stats.js</a></b></td>
							<td style='padding: 8px;'>- Provides comprehensive statistical analysis of user journal entries within specified date ranges, including word counts, mood trends, activity patterns, streaks, and engagement metrics<br>- Facilitates insights into user behavior, content quality, and overall engagement, supporting data-driven enhancements to the journaling platforms features and user experience.</td>
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
					<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/master/electron/main.js'>main.js</a></b></td>
					<td style='padding: 8px;'>- Manages the main process of an Electron application by initializing the primary window, handling auto-updates, secure token storage, and window controls<br>- Facilitates communication between the renderer and main processes through IPC, ensuring smooth app lifecycle management, secure data handling, and update workflows within the overall architecture.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/master/electron/preload.js'>preload.js</a></b></td>
					<td style='padding: 8px;'>- Facilitates secure communication between the Electron renderer process and main process by exposing APIs for token management, window controls, application information, and auto-updater functionalities<br>- Enables the renderer to invoke main process actions and listen for update events, ensuring seamless user interactions and application maintenance within the overall architecture.</td>
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
					<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/master/client/package.json'>package.json</a></b></td>
					<td style='padding: 8px;'>- Defines the client-side configuration and dependencies for the ArcJournal application, enabling a rich, interactive editing experience with React and Tiptap<br>- It orchestrates development, build, and preview workflows, supporting seamless content creation and management within the overall architecture<br>- This setup ensures a responsive, feature-rich user interface aligned with the projects journaling and content editing objectives.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/master/client/vite.config.js'>vite.config.js</a></b></td>
					<td style='padding: 8px;'>- Configures the development and build environment for the client-side application, ensuring seamless integration of React components with Vite<br>- It establishes project paths, server settings, and build output, facilitating efficient development workflows and optimized production deployment within the overall architecture<br>- This setup supports a smooth, modern front-end experience aligned with the projects modular structure.</td>
				</tr>
				<tr style='border-bottom: 1px solid #eee;'>
					<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/master/client/index.html'>index.html</a></b></td>
					<td style='padding: 8px;'>- Serves as the entry point for the client-side application, initializing the user interface within the root DOM element<br>- It loads the main React component, facilitating the rendering of the applications core features and layout<br>- This file integrates essential styles and development tools, enabling a seamless user experience and supporting development workflows within the overall architecture.</td>
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
							<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/master/client/src/main.jsx'>main.jsx</a></b></td>
							<td style='padding: 8px;'>- Sets up the React applications entry point by rendering the main App component into the DOM<br>- It initializes the client-side interface, ensuring the entire user interface is mounted within the root element<br>- This foundational code facilitates the startup of the applications user experience, integrating global styles and enabling React's strict mode for enhanced development checks.</td>
						</tr>
						<tr style='border-bottom: 1px solid #eee;'>
							<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/master/client/src/App.jsx'>App.jsx</a></b></td>
							<td style='padding: 8px;'>- Defines the client-side routing architecture for the application, managing navigation flows based on user authentication and onboarding status<br>- Implements layout components that conditionally render pages such as sign-in, onboarding, and main app sections, ensuring users are directed appropriately and the interface adapts to their current state within the overall user journey.</td>
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
									<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/master/client/src/context/ToastContext.jsx'>ToastContext.jsx</a></b></td>
									<td style='padding: 8px;'>- Provides a centralized mechanism for managing and displaying toast notifications across the application<br>- Facilitates user feedback by showing transient success, error, or informational messages, enhancing user experience and communication within the overall architecture<br>- Integrates seamlessly with the React component tree, ensuring consistent and accessible notifications throughout the interface.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/master/client/src/context/AuthContext.jsx'>AuthContext.jsx</a></b></td>
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
									<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/master/client/src/utils/birthday.js'>birthday.js</a></b></td>
									<td style='padding: 8px;'>- Provides utility functions for handling user birthdays, including date comparisons, formatting, and age calculations, to support personalized user experiences<br>- Also offers time-based greetings and display name retrieval, enhancing user engagement and interface responsiveness within the applications architecture.</td>
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
									<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/master/client/src/api/index.js'>index.js</a></b></td>
									<td style='padding: 8px;'>- Provides a centralized API client for interacting with backend services, managing authentication, user profiles, entries, wraps, and statistics<br>- Facilitates secure, streamlined communication between the client application and server, handling token management and request configuration to support core functionalities such as user authentication, data entry management, and analytics within the overall architecture.</td>
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
									<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/master/client/src/pages/Settings.jsx'>Settings.jsx</a></b></td>
									<td style='padding: 8px;'>- Provides a user interface for managing personal profile settings, account deletion, and data management within the application<br>- Facilitates profile updates, age calculation, and critical account actions like deleting entries or the entire account, ensuring user control over personal data<br>- Integrates with backend APIs and context providers to maintain synchronization and user feedback across the platform.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/master/client/src/pages/SignIn.jsx'>SignIn.jsx</a></b></td>
									<td style='padding: 8px;'>- Facilitates user authentication by providing a sign-in interface that captures credentials, manages login flow, and handles errors<br>- Integrates with authentication and toast notification contexts to deliver a seamless login experience within the applications architecture, enabling secure access to protected areas and enhancing user engagement.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/master/client/src/pages/Dashboard.jsx'>Dashboard.jsx</a></b></td>
									<td style='padding: 8px;'>- Provides an interactive dashboard for daily journaling, enabling users to record reflections, assign day grades, and select emojis to express their mood<br>- Incorporates birthday-specific prompts and displays relevant greetings, fostering personalized engagement<br>- Integrates with backend APIs to fetch and save entries, supporting a seamless user experience within the broader journaling and self-reflection architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/master/client/src/pages/SignUp.jsx'>SignUp.jsx</a></b></td>
									<td style='padding: 8px;'>- Facilitates user account creation within the ArcJournal platform by providing a registration interface<br>- Handles input validation, communicates with authentication services, and offers real-time feedback to guide new users through the sign-up process<br>- Integrates seamlessly into the overall architecture to enable onboarding and user management for the ArcNode Network.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/master/client/src/pages/Onboarding.jsx'>Onboarding.jsx</a></b></td>
									<td style='padding: 8px;'>- Facilitates user onboarding by guiding new users through personalized setup steps, including profile details and journaling goals<br>- Ensures seamless data collection, validation, and submission to enhance user experience and tailor content, ultimately integrating users into the broader application architecture focused on personalized journaling and user engagement.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/master/client/src/pages/Journal.jsx'>Journal.jsx</a></b></td>
									<td style='padding: 8px;'>- Journal.jsxThis component serves as the central interface for users to view, create, and manage their journal entries within the application<br>- It provides a calendar-based view that allows users to navigate through different months, select specific dates, and access or add entries associated with those dates<br>- Additionally, it integrates features such as emotion tagging, rich text editing, and comments, fostering a comprehensive journaling experience<br>- Overall, Journal.jsx acts as the primary hub for user reflection and record-keeping, seamlessly connecting date navigation, content management, and interactive feedback within the applications architecture.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/master/client/src/pages/ArcWrapped.jsx'>ArcWrapped.jsx</a></b></td>
									<td style='padding: 8px;'>- The <code>ArcWrapped.jsx</code> file serves as a key component within the client-side architecture, responsible for presenting a comprehensive overview of user emotional and engagement metrics over customizable timeframes<br>- It fetches statistical data from the API, processes it, and displays it through an intuitive interface featuring dynamic visual cues such as color-coded grades and emoji representations<br>- This component enables users to analyze their emotional patterns and activity trends, thereby supporting the applications goal of fostering self-awareness and mental well-being<br>- Overall, it acts as an interactive dashboard that visualizes user insights, integrating seamlessly into the broader architecture focused on personalized data-driven experiences.</td>
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
									<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/master/client/src/components/EmojiPicker.jsx'>EmojiPicker.jsx</a></b></td>
									<td style='padding: 8px;'>- Provides an interactive emoji-based emotion selector integrated into the user interface, enabling users to express their current feelings visually<br>- It enhances user engagement and emotional clarity within the application by offering a curated set of emotion icons, labels, and visual feedback, contributing to a more personalized and intuitive user experience across the platform.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/master/client/src/components/Spinner.jsx'>Spinner.jsx</a></b></td>
									<td style='padding: 8px;'>- Provides a reusable loading indicator component that visually communicates ongoing processes within the user interface<br>- It enhances user experience by signaling activity during data fetching or processing states, contributing to a cohesive and responsive design across the application<br>- The spinners customizable size and color ensure seamless integration with various UI themes and contexts.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/master/client/src/components/TitleBar.jsx'>TitleBar.jsx</a></b></td>
									<td style='padding: 8px;'>- Provides a custom title bar component for the application, enabling window control actions such as close, minimize, and maximize within an Electron environment<br>- When running outside Electron, it displays a static header<br>- This component integrates seamlessly into the overall architecture by offering platform-specific window management, enhancing user experience across desktop environments.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/master/client/src/components/RichEditor.jsx'>RichEditor.jsx</a></b></td>
									<td style='padding: 8px;'>- RichEditor.jsxThis component provides a rich text editing interface within the application, enabling users to create, format, and annotate content dynamically<br>- It leverages the Tiptap editor framework to support a wide range of text styles, media embedding, and task management features, facilitating complex document editing workflows<br>- As a core part of the client-side architecture, it ensures a seamless and interactive user experience for content creation, editing, and collaboration, integrating various extensions to enhance functionality and flexibility across the application.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/master/client/src/components/Modal.jsx'>Modal.jsx</a></b></td>
									<td style='padding: 8px;'>- Provides a reusable modal component for user interactions, enabling confirmation prompts, alerts, or dialogs within the application<br>- It integrates seamlessly into the overall architecture by offering a flexible, styled overlay that manages user responses, ensuring consistent modal behavior across different features and enhancing user experience throughout the project.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/master/client/src/components/CommentsSidebar.jsx'>CommentsSidebar.jsx</a></b></td>
									<td style='padding: 8px;'>- Provides an interactive sidebar for managing user comments within the application<br>- It enables viewing, searching, highlighting, and deleting comments, facilitating seamless user engagement and feedback tracking<br>- The component integrates with the overall architecture to enhance content review workflows and improve user collaboration by offering an organized, accessible comment interface.</td>
								</tr>
								<tr style='border-bottom: 1px solid #eee;'>
									<td style='padding: 8px;'><b><a href='https://github.com/stinoooo/ArcJournal/blob/master/client/src/components/Sidebar.jsx'>Sidebar.jsx</a></b></td>
									<td style='padding: 8px;'>- Provides the navigational sidebar for the application, enabling users to access main sections such as Today, Journal, Stats, and Settings<br>- It displays user information, including name and email, highlights birthdays, and facilitates user logout<br>- Integrates with authentication and routing systems, supporting seamless navigation and personalized user experience within the overall app architecture.</td>
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

Arcjournal is protected under the [MIT](https://github.com/stinoooo/ArcJournal/blob/main/LICENSE) License. For more details, refer to the [LICENSE](https://github.com/stinoooo/ArcJournal/blob/main/LICENSE) file.

---

<div align="left"><a href="#top">⬆ Return</a></div>

---

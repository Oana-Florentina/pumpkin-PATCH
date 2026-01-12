# 🎃 PhoA - Phobia Web Assistant

<div align="center">
  <p>A semantic web application for managing and overcoming phobias through context-aware alerts and personalized remedies</p>
  
  <p>
    <a href="#about">About</a> •
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#documentation">Documentation</a> •
    <a href="#team">Team</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/project-wade-blue" alt="project">
    <img src="https://img.shields.io/badge/university-infoiasi-green" alt="infoiasi">
    <img src="https://img.shields.io/badge/course-wade-orange" alt="wade">
    <img src="https://img.shields.io/badge/tech-web-red" alt="web">
  </p>
</div>

---

## 📋 About

PhoA (Phobia Web Assistant) is a multi-device web application designed to help users manage and overcome phobias through:
- **Personalized remedies** from DBpedia and Wikidata knowledge bases
- **Context-aware alerts** based on time, location, weather, and device sensors
- **Semantic web integration** using RDF, SPARQL, and Schema.org
- **Multi-user support** for families, coworkers, and social networks
- **Real-time monitoring** through smartwatch integration

This project was developed as part of the Web Application Development (WADe) course at Alexandru Ioan Cuza University of Iași.

---

## ✨ Features

### 🧠 Semantic Web Integration
- RDF data modeling with Schema.org vocabulary
- RDFa markup in HTML5 pages
- SPARQL queries for DBpedia and Wikidata
- Linked data principles for phobia information

### 🔔 Context-Aware Alerts
- **Time-based**: Nighttime alerts, seasonal warnings, medication reminders
- **Location-based**: GPS tracking with reverse geocoding (Nominatim)
- **Weather-based**: Temperature, precipitation, UV index (Open-Meteo)
- **Device-based**: Heart rate, altitude, noise level monitoring (simulated)

### 📱 Multi-Device Support
- Responsive web interface (React)
- Smartwatch integration simulation
- Real-time monitoring
- Environmental sensor data

### 👥 User Management
- AWS Cognito authentication
- Email verification with confirmation links
- Session persistence
- Group support for families and friends

### 💊 Remedies & Resources
- Medication recommendations from Wikidata
- Physical and psychological exercises
- External resources from DBpedia
- Evidence-based treatment suggestions

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18.2.0
- **Routing**: React Router DOM 7.12.0
- **Authentication**: Amazon Cognito Identity JS 6.3.16
- **Styling**: Custom CSS with dark mode support

### Backend
- **Runtime**: Node.js with Express 5.2.1
- **Deployment**: AWS Lambda (serverless)
- **Database**: AWS DynamoDB
- **Authentication**: AWS Cognito

### APIs 
- **Open-Meteo**: Weather data
- **Sunrise-Sunset.org**: Daylight tracking
- **Nominatim (OpenStreetMap)**: Reverse geocoding

### Semantic Web
- **Vocabularies**: Schema.org, DBpedia Ontology
- **Query Language**: SPARQL
- **Markup**: RDFa in HTML5
- **Knowledge Bases**: DBpedia, Wikidata

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- AWS Account (for deployment)
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Oana-Florentina/pumpkin-PATCH.git
cd pumpkin-PATCH
```

2. **Install frontend dependencies**
```bash
cd frontend
npm install
```

3. **Install backend dependencies**
```bash
cd ../backend
npm install
```

4. **Configure AWS Credentials**
```bash
aws configure
```

### Running Locally

**Frontend:**
```bash
cd frontend
npm start
```
Access at `http://localhost:3000`

**Backend:**
```bash
cd backend
node index.js
```
Runs on `http://localhost:3001`

### Deployment

The application is deployed using GitHub Actions:
- **Frontend**: AWS S3 + CloudFront
- **Backend**: AWS Lambda + API Gateway
- **Database**: AWS DynamoDB

---

## 📚 Documentation

### Project Deliverables

- **[Technical Report](scholarly-report.html)** - Scholarly HTML format with architecture diagrams
- **[SPARQL Queries](frontend/SPARQL_QUERIES.md)** - DBpedia and Wikidata integration
- **[API Documentation](DOCUMENTATION.md)** - Complete technical documentation
- **[Architecture Diagram](scholarly-report.html#architecture)** - System design and data flow

### Key Documents

- **Diagrams**: System architecture visualization (in Scholarly HTML report)
- **User Guide**: How to use PhoA (coming soon)
- **Video Demo**: Application walkthrough (coming soon)

---

## 🏗️ Architecture

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  React Frontend │
│   (RDFa + CSS)  │
└────────┬────────┘
         │
         ▼
┌──────────────────┐
│  AWS API Gateway │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────┐
│    AWS Lambda Backend    │
│  ┌────────────────────┐  │
│  │  Routes & Services │  │
│  │  - Phobias         │  │
│  │  - Context         │  │
│  │  - Users           │  │
│  │  - Groups          │  │
│  └────────────────────┘  │
└───┬──────────────────┬───┘
    │                  │
    ▼                  ▼
┌─────────┐      ┌──────────────┐
│ Cognito │      │  DynamoDB    │
└─────────┘      └──────────────┘
    │
    ▼
┌──────────────────────────┐
│   External APIs          │
│  - Open-Meteo            │
│  - Sunrise-Sunset        │
│  - Nominatim             │
│  - DBpedia (SPARQL)      │
│  - Wikidata (SPARQL)     │
└──────────────────────────┘
```

---

## 🎯 Semantic Web Implementation

### RDFa Example
```html
<div vocab="http://schema.org/" typeof="MedicalCondition">
  <h2 property="name">Arachnophobia</h2>
  <p property="description">Fear of spiders</p>
  <span property="code" typeof="MedicalCode">
    <meta property="codeValue" content="F40.210"/>
  </span>
</div>
```

### SPARQL Query Example
```sparql
PREFIX dbo: <http://dbpedia.org/ontology/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT ?phobia ?label ?abstract
WHERE {
  ?phobia a dbo:Disease ;
          rdfs:label ?label ;
          dbo:abstract ?abstract .
  FILTER(CONTAINS(LCASE(?label), "phobia"))
  FILTER(LANG(?label) = "en")
}
LIMIT 10
```

---

## 🧪 Testing

Run frontend tests:
```bash
cd frontend
npm test
```

Run backend tests:
```bash
cd backend
npm test
```

---

## 📊 Project Status

- ✅ Frontend development complete
- ✅ Backend API implementation complete
- ✅ AWS Cognito authentication integrated
- ✅ Semantic web integration (RDF, SPARQL)
- ✅ Context-aware alert system
- ✅ Device simulation
- ✅ Dark mode implementation
- 🚧 Technical report (in progress)
- 📝 User guide (planned)
- 🎥 Video demo (planned)

---

## 👥 Team

**Briana-Stefania Maftei**
- Backend architecture and AWS deployment
- Semantic web integration (RDF, SPARQL)
- Authentication system (AWS Cognito)
- DynamoDB database design
- Backend API routes and microservices
- Rule-based alert system logic

**Oana-Florentina Dumitriu**
- Frontend development (React components)
- UI/UX design and responsive layout
- Device simulation and monitoring
- Dark mode and theme switching
- API integrations (Open-Meteo, Nominatim, Sunrise-Sunset)
- Context-aware alert implementation
- RDFa markup and Schema.org integration
- Time-based and environmental services

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔗 Links

- **Repository**: [https://github.com/Oana-Florentina/pumpkin-PATCH](https://github.com/Oana-Florentina/pumpkin-PATCH)
- **Live Demo**: [Coming Soon]
- **Technical Report**: [scholarly-report.html](scholarly-report.html)
- **University**: [Alexandru Ioan Cuza University of Iași](https://www.info.uaic.ro/)
- **Course**: Web Application Development (WADe)

---

## 🙏 Acknowledgments

- DBpedia and Wikidata for semantic data
- Open-Meteo for weather API
- OpenStreetMap for geocoding services
- AWS for cloud infrastructure
- Schema.org for vocabulary standards

---

## 📧 Contact

For questions or feedback, please open an issue on GitHub or contact the team members.

---

<div align="center">
  <p>Made with ❤️ for WADe 2025-2026</p>
  <p>
    <img src="https://img.shields.io/badge/project-wade-blue" alt="project">
    <img src="https://img.shields.io/badge/university-infoiasi-green" alt="infoiasi">
    <img src="https://img.shields.io/badge/course-wade-orange" alt="wade">
    <img src="https://img.shields.io/badge/tech-web-red" alt="web">
  </p>
</div>

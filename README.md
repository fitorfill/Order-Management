# Silk Road Order Management System

A historical-themed order management system based on the ancient Silk Road trading routes.

## Overview

The Silk Road Order Management System is a web application that helps track orders, customers, and products with a rich historical theme inspired by ancient trading routes. The system features a Django backend with a React frontend.

## Features

- **Historical Theming**: Uses Silk Road merchant trading theme throughout the UI
- **Order Management**: Create, view, update, and delete trade orders
- **Customer Database**: Maintain a list of merchants from different regions
- **Product Catalog**: Catalog of products from various origins along the Silk Road
- **Dashboard**: View key metrics and filter orders by status, payment method, etc.

## Tech Stack

- **Backend**: Django, Django Rest Framework
- **Frontend**: React, React Router, Context API
- **Authentication**: Token-based authentication
- **Database**: SQLite (development), PostgreSQL (production recommended)

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start the development server
python manage.py runserver
```

### Frontend Setup

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

## Project Structure


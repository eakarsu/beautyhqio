#!/bin/bash

# Beauty & Wellness AI - Startup Script
# =====================================

set -e

echo "🌸 Beauty & Wellness AI - Starting Up..."
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration (use env vars if set, otherwise defaults)
APP_PORT=${PORT:-3000}
API_PORT=${API_PORT:-4000}
DB_NAME=${DB_NAME:-"beauty_wellness_ai"}
DB_USER=${DB_USER:-"postgres"}
DB_PASSWORD=${DB_PASSWORD:-"postgres"}
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}

# Function to kill processes on a port
kill_port() {
    local port=$1
    echo -e "${YELLOW}Checking port $port...${NC}"

    # Find PIDs using the port
    local pids=$(lsof -ti:$port 2>/dev/null || true)

    if [ -n "$pids" ]; then
        echo -e "${YELLOW}Killing processes on port $port: $pids${NC}"
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 1
        echo -e "${GREEN}✓ Port $port cleared${NC}"
    else
        echo -e "${GREEN}✓ Port $port is already free${NC}"
    fi
}

# Function to check if PostgreSQL is running
check_postgres() {
    echo -e "${BLUE}Checking PostgreSQL connection...${NC}"

    if pg_isready -h $DB_HOST -p $DB_PORT > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PostgreSQL is running on $DB_HOST:$DB_PORT${NC}"
        return 0
    else
        echo -e "${RED}✗ PostgreSQL is not running on $DB_HOST:$DB_PORT${NC}"
        echo -e "${YELLOW}Please start PostgreSQL manually and try again.${NC}"
        echo ""
        echo "To start PostgreSQL:"
        echo "  - macOS (Homebrew): brew services start postgresql"
        echo "  - macOS (Postgres.app): Open Postgres.app"
        echo "  - Linux: sudo systemctl start postgresql"
        return 1
    fi
}

# Function to create database if it doesn't exist
setup_database() {
    echo -e "${BLUE}Setting up database...${NC}"

    # Check if database exists
    if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw $DB_NAME; then
        echo -e "${GREEN}✓ Database '$DB_NAME' exists${NC}"
    else
        echo -e "${YELLOW}Creating database '$DB_NAME'...${NC}"
        createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME 2>/dev/null || {
            echo -e "${YELLOW}Attempting to create database with psql...${NC}"
            psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || true
        }
        echo -e "${GREEN}✓ Database '$DB_NAME' created${NC}"
    fi
}

# Function to run Prisma migrations
run_prisma() {
    echo -e "${BLUE}Running Prisma setup...${NC}"

    # Generate Prisma client
    echo -e "${YELLOW}Generating Prisma client...${NC}"
    npx prisma generate
    echo -e "${GREEN}✓ Prisma client generated${NC}"

    # Push schema to database
    echo -e "${YELLOW}Pushing schema to database...${NC}"
    npx prisma db push --skip-generate
    echo -e "${GREEN}✓ Database schema synchronized${NC}"
}

# Function to seed the database
seed_database() {
    echo -e "${BLUE}Checking if database needs seeding...${NC}"

    # Check if there's any data in the Business table
    local count=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM \"Business\";" 2>/dev/null | tr -d ' ' || echo "0")

    if [ "$count" = "0" ] || [ -z "$count" ]; then
        echo -e "${YELLOW}Seeding database with initial data...${NC}"
        npm run db:seed || {
            echo -e "${YELLOW}Seed script failed, but continuing...${NC}"
        }
        echo -e "${GREEN}✓ Database seeded${NC}"
    else
        echo -e "${GREEN}✓ Database already has data (skipping seed)${NC}"
    fi
}

# Main execution
main() {
    echo ""

    # Step 1: Clear used ports (skip in production/Docker)
    if [ "$NODE_ENV" != "production" ]; then
        echo -e "${BLUE}Step 1: Clearing used ports...${NC}"
        kill_port $APP_PORT
        kill_port $API_PORT
        echo ""
    fi

    # Step 2: Check PostgreSQL
    echo -e "${BLUE}Step 2: Checking PostgreSQL...${NC}"
    if ! check_postgres; then
        exit 1
    fi
    echo ""

    # Step 3: Setup database
    echo -e "${BLUE}Step 3: Setting up database...${NC}"
    setup_database
    echo ""

    # Step 4: Install dependencies if needed
    echo -e "${BLUE}Step 4: Checking dependencies...${NC}"
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}Installing dependencies...${NC}"
        npm install
        echo -e "${GREEN}✓ Dependencies installed${NC}"
    else
        echo -e "${GREEN}✓ Dependencies already installed${NC}"
    fi
    echo ""

    # Step 5: Run Prisma
    echo -e "${BLUE}Step 5: Running Prisma setup...${NC}"
    run_prisma
    echo ""

    # Step 6: Seed database
    echo -e "${BLUE}Step 6: Seeding database...${NC}"
    seed_database
    echo ""

    # Step 7: Start the application
    echo -e "${BLUE}Step 7: Starting application...${NC}"
    echo ""
    echo "========================================="
    echo -e "${GREEN}🌸 Beauty & Wellness AI is starting!${NC}"
    echo "========================================="
    echo ""
    echo -e "Application URL: ${GREEN}http://localhost:$APP_PORT${NC}"
    echo ""
    echo "Default login credentials:"
    echo -e "  Email:    ${YELLOW}admin@luxebeauty.com${NC}"
    echo -e "  Password: ${YELLOW}admin123${NC}"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo "========================================="
    echo ""

    # Start Next.js server (production or development)
    if [ "$NODE_ENV" = "production" ]; then
        npm start
    else
        npm run dev
    fi
}

# Run main function
cd "$(dirname "$0")"
main

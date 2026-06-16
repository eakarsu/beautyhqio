#!/bin/bash
#
# Snyk Vulnerability Resolver - Shell Wrapper
# A generic tool to detect and fix security vulnerabilities across Java, Node.js, and Python projects.
#
# Usage:
#   ./snyk-resolver.sh [scan|fix|report] [options]
#
# Commands:
#   scan    - Scan for vulnerabilities
#   fix     - Scan and fix vulnerabilities
#   report  - Generate a detailed JSON report
#
# Options:
#   --path PATH         Project path (default: current directory)
#   --type TYPE         Force project type: java, node, python
#   --output FILE       Output file for report (default: snyk-report.json)
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
PROJECT_PATH="."
PROJECT_TYPE=""
OUTPUT_FILE="snyk-report.json"
COMMAND="scan"

# Print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Detect project type
detect_project_type() {
    local path="$1"

    if [[ -f "$path/pom.xml" ]] || [[ -f "$path/build.gradle" ]] || [[ -f "$path/build.gradle.kts" ]]; then
        echo "java"
    elif [[ -f "$path/package.json" ]]; then
        echo "node"
    elif [[ -f "$path/requirements.txt" ]] || [[ -f "$path/Pipfile" ]] || [[ -f "$path/pyproject.toml" ]]; then
        echo "python"
    else
        echo "unknown"
    fi
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."

    # Check Snyk CLI
    if ! command -v snyk &> /dev/null; then
        print_error "Snyk CLI is not installed."
        echo "Install with: npm install -g snyk"
        exit 1
    fi

    # Check Snyk auth
    if ! snyk auth --check &> /dev/null; then
        print_warning "Snyk is not authenticated. Some features may not work."
        echo "Authenticate with: snyk auth"
    fi

    print_success "Prerequisites check passed"
}

# Scan for vulnerabilities
scan_vulnerabilities() {
    local path="$1"
    local type="$2"

    print_info "Scanning $type project at $path..."

    local snyk_args=("test" "--json")

    case "$type" in
        java)
            if [[ -f "$path/pom.xml" ]]; then
                snyk_args+=("--file=pom.xml")
            elif [[ -f "$path/build.gradle" ]]; then
                snyk_args+=("--file=build.gradle")
            fi
            ;;
        node)
            snyk_args+=("--file=package.json")
            ;;
        python)
            if [[ -f "$path/requirements.txt" ]]; then
                snyk_args+=("--file=requirements.txt")
            elif [[ -f "$path/Pipfile" ]]; then
                snyk_args+=("--file=Pipfile")
            fi
            ;;
    esac

    cd "$path"

    local result
    result=$(snyk "${snyk_args[@]}" 2>/dev/null || true)

    # Parse and display results
    local vuln_count
    vuln_count=$(echo "$result" | jq '.vulnerabilities | length' 2>/dev/null || echo "0")

    if [[ "$vuln_count" == "0" ]] || [[ -z "$vuln_count" ]]; then
        print_success "No vulnerabilities found!"
        return 0
    fi

    # Count by severity
    local critical high medium low
    critical=$(echo "$result" | jq '[.vulnerabilities[] | select(.severity=="critical")] | length' 2>/dev/null || echo "0")
    high=$(echo "$result" | jq '[.vulnerabilities[] | select(.severity=="high")] | length' 2>/dev/null || echo "0")
    medium=$(echo "$result" | jq '[.vulnerabilities[] | select(.severity=="medium")] | length' 2>/dev/null || echo "0")
    low=$(echo "$result" | jq '[.vulnerabilities[] | select(.severity=="low")] | length' 2>/dev/null || echo "0")

    echo ""
    echo "=================================================="
    echo "VULNERABILITY SUMMARY"
    echo "=================================================="
    echo "Total: $vuln_count vulnerabilities"
    echo -e "  ${RED}Critical:${NC} $critical"
    echo -e "  ${YELLOW}High:${NC}     $high"
    echo -e "  ${BLUE}Medium:${NC}   $medium"
    echo -e "  Low:      $low"
    echo ""

    # Store result for later use
    echo "$result" > /tmp/snyk-scan-result.json

    return 1
}

# Fix vulnerabilities
fix_vulnerabilities() {
    local path="$1"
    local type="$2"

    print_info "Attempting to fix vulnerabilities..."

    cd "$path"

    case "$type" in
        java)
            if [[ -f "pom.xml" ]]; then
                print_info "Updating Maven dependencies..."
                mvn versions:use-latest-releases -DallowMajorUpdates=false -DallowSnapshots=false 2>/dev/null || true
            elif [[ -f "build.gradle" ]]; then
                print_info "Gradle auto-fix requires manual intervention or a plugin"
            fi
            ;;
        node)
            if [[ -f "yarn.lock" ]]; then
                print_info "Using Yarn to fix..."
                yarn upgrade 2>/dev/null || true
            elif [[ -f "pnpm-lock.yaml" ]]; then
                print_info "Using pnpm to fix..."
                pnpm update 2>/dev/null || true
            else
                print_info "Using npm audit fix..."
                npm audit fix 2>/dev/null || true
                npm audit fix --force 2>/dev/null || true
            fi
            ;;
        python)
            if [[ -f "requirements.txt" ]]; then
                print_info "Updating Python packages..."
                if command -v pip-audit &> /dev/null; then
                    pip-audit --fix -r requirements.txt 2>/dev/null || true
                else
                    # Manual upgrade
                    pip install --upgrade -r requirements.txt 2>/dev/null || true
                fi
            elif [[ -f "Pipfile" ]]; then
                print_info "Updating Pipenv dependencies..."
                pipenv update 2>/dev/null || true
            elif [[ -f "pyproject.toml" ]]; then
                print_info "Updating Poetry dependencies..."
                poetry update 2>/dev/null || true
            fi
            ;;
    esac

    print_success "Fix attempt completed"

    # Re-scan
    print_info "Re-scanning to verify fixes..."
    scan_vulnerabilities "$path" "$type"
}

# Generate report
generate_report() {
    local path="$1"
    local output="$2"

    print_info "Generating report..."

    cd "$path"

    # Run Snyk with JSON output
    snyk test --json > "$output" 2>/dev/null || true

    print_success "Report saved to $output"
}

# Parse arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            scan|fix|report)
                COMMAND="$1"
                shift
                ;;
            --path)
                PROJECT_PATH="$2"
                shift 2
                ;;
            --type)
                PROJECT_TYPE="$2"
                shift 2
                ;;
            --output)
                OUTPUT_FILE="$2"
                shift 2
                ;;
            -h|--help)
                echo "Usage: $0 [scan|fix|report] [options]"
                echo ""
                echo "Commands:"
                echo "  scan    - Scan for vulnerabilities"
                echo "  fix     - Scan and fix vulnerabilities"
                echo "  report  - Generate a detailed JSON report"
                echo ""
                echo "Options:"
                echo "  --path PATH     Project path (default: current directory)"
                echo "  --type TYPE     Force project type: java, node, python"
                echo "  --output FILE   Output file for report"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
}

# Main
main() {
    parse_args "$@"

    # Resolve project path
    PROJECT_PATH=$(realpath "$PROJECT_PATH")

    # Detect project type if not specified
    if [[ -z "$PROJECT_TYPE" ]]; then
        PROJECT_TYPE=$(detect_project_type "$PROJECT_PATH")
        if [[ "$PROJECT_TYPE" == "unknown" ]]; then
            print_error "Could not detect project type. Use --type to specify."
            exit 1
        fi
    fi

    echo ""
    echo "=================================================="
    echo "SNYK VULNERABILITY RESOLVER"
    echo "=================================================="
    echo "Project Path: $PROJECT_PATH"
    echo "Project Type: $PROJECT_TYPE"
    echo "Command: $COMMAND"
    echo ""

    check_prerequisites

    case "$COMMAND" in
        scan)
            scan_vulnerabilities "$PROJECT_PATH" "$PROJECT_TYPE"
            ;;
        fix)
            fix_vulnerabilities "$PROJECT_PATH" "$PROJECT_TYPE"
            ;;
        report)
            generate_report "$PROJECT_PATH" "$OUTPUT_FILE"
            ;;
    esac
}

main "$@"

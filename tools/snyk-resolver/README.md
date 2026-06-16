# Snyk Vulnerability Resolver

A generic tool to detect and fix security vulnerabilities across **Java**, **Node.js**, and **Python** projects using Snyk.

## Features

- **Auto-detection**: Automatically detects project type based on manifest files
- **Multi-language support**: Works with Java (Maven/Gradle), Node.js (npm/yarn/pnpm), and Python (pip/pipenv/poetry)
- **Scan**: Identify vulnerabilities with severity classification
- **Fix**: Automatically apply patches and dependency updates
- **Report**: Generate detailed JSON reports for CI/CD integration

## Prerequisites

1. **Snyk CLI** installed:
   ```bash
   npm install -g snyk
   ```

2. **Snyk authentication**:
   ```bash
   snyk auth
   ```

3. **Language-specific package managers**:
   - Java: `mvn` or `gradle`
   - Node.js: `npm`, `yarn`, or `pnpm`
   - Python: `pip`, `pipenv`, or `poetry`

## Installation

1. Download and extract the tool
2. Make scripts executable:
   ```bash
   chmod +x snyk-resolver.py snyk-resolver.sh
   ```

## Usage

### Python Script (Recommended)

```bash
# Scan only
python snyk-resolver.py --scan-only

# Scan and fix
python snyk-resolver.py --fix

# Generate report
python snyk-resolver.py --report vulnerability-report.json

# Specify project path and type
python snyk-resolver.py --path /path/to/project --project-type node --fix
```

### Shell Script

```bash
# Scan
./snyk-resolver.sh scan

# Fix
./snyk-resolver.sh fix

# Generate report
./snyk-resolver.sh report --output my-report.json

# Specify project path and type
./snyk-resolver.sh fix --path /path/to/project --type java
```

## Project Type Detection

The tool automatically detects project type based on these files:

| Project Type | Detected Files |
|--------------|----------------|
| Java         | `pom.xml`, `build.gradle`, `build.gradle.kts` |
| Node.js      | `package.json`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml` |
| Python       | `requirements.txt`, `Pipfile`, `pyproject.toml`, `setup.py` |

## Fix Strategies

### Java
- Maven: Uses `versions-maven-plugin` to update dependencies
- Gradle: Requires manual intervention or plugins like `gradle-versions-plugin`

### Node.js
- npm: `npm audit fix` and `npm audit fix --force`
- yarn: `yarn upgrade`
- pnpm: `pnpm update`

### Python
- pip: Uses `pip-audit --fix` or manual `pip install --upgrade`
- pipenv: `pipenv update`
- poetry: `poetry update`

## CI/CD Integration

### GitHub Actions

```yaml
name: Security Scan

on: [push, pull_request]

jobs:
  snyk:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Snyk
        run: npm install -g snyk

      - name: Authenticate Snyk
        run: snyk auth ${{ secrets.SNYK_TOKEN }}

      - name: Run Snyk Resolver
        run: python snyk-resolver.py --report snyk-report.json

      - name: Upload Report
        uses: actions/upload-artifact@v4
        with:
          name: snyk-report
          path: snyk-report.json
```

### GitLab CI

```yaml
snyk-scan:
  image: python:3.11
  before_script:
    - npm install -g snyk
    - snyk auth $SNYK_TOKEN
  script:
    - python snyk-resolver.py --report snyk-report.json
  artifacts:
    paths:
      - snyk-report.json
```

### Jenkins

```groovy
pipeline {
    agent any

    stages {
        stage('Security Scan') {
            steps {
                sh 'npm install -g snyk'
                withCredentials([string(credentialsId: 'snyk-token', variable: 'SNYK_TOKEN')]) {
                    sh 'snyk auth $SNYK_TOKEN'
                }
                sh 'python snyk-resolver.py --fix --report snyk-report.json'
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'snyk-report.json', fingerprint: true
        }
    }
}
```

## Report Format

The JSON report includes:

```json
{
  "generated_at": "2024-01-15T10:30:00",
  "project_path": "/path/to/project",
  "project_type": "node",
  "summary": {
    "total_vulnerabilities": 15,
    "critical": 2,
    "high": 5,
    "medium": 6,
    "low": 2
  },
  "vulnerabilities": [
    {
      "id": "SNYK-JS-LODASH-1234",
      "title": "Prototype Pollution",
      "severity": "critical",
      "package": "lodash",
      "version": "4.17.15",
      "fix_version": "4.17.21",
      "description": "...",
      "url": "https://snyk.io/vuln/SNYK-JS-LODASH-1234"
    }
  ]
}
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0    | No vulnerabilities found |
| 1    | Vulnerabilities found |
| 2    | Error during execution |

## License

MIT License

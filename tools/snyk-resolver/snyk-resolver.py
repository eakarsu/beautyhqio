#!/usr/bin/env python3
"""
Snyk Vulnerability Resolver
A generic tool to detect and fix security vulnerabilities across Java, Node.js, and Python projects.

Usage:
    python snyk-resolver.py [--scan-only] [--fix] [--report] [--project-type TYPE]

Options:
    --scan-only      Only scan for vulnerabilities, don't fix
    --fix            Automatically fix vulnerabilities where possible
    --report         Generate a detailed vulnerability report
    --project-type   Force project type: java, node, or python (auto-detected if not specified)
"""

import argparse
import json
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple


class SnykResolver:
    """Generic Snyk vulnerability resolver for multi-language projects."""

    SUPPORTED_TYPES = ["java", "node", "python"]

    def __init__(self, project_path: str = ".", project_type: Optional[str] = None):
        self.project_path = Path(project_path).resolve()
        self.project_type = project_type or self._detect_project_type()
        self.vulnerabilities: List[Dict] = []
        self.fixed_count = 0
        self.skipped_count = 0

    def _detect_project_type(self) -> str:
        """Auto-detect project type based on manifest files."""
        markers = {
            "java": ["pom.xml", "build.gradle", "build.gradle.kts"],
            "node": ["package.json", "package-lock.json", "yarn.lock", "pnpm-lock.yaml"],
            "python": ["requirements.txt", "Pipfile", "pyproject.toml", "setup.py"],
        }

        detected_types = []
        for ptype, files in markers.items():
            for f in files:
                if (self.project_path / f).exists():
                    detected_types.append(ptype)
                    break

        if not detected_types:
            print("Warning: Could not detect project type. Defaulting to 'node'.")
            return "node"

        if len(detected_types) > 1:
            print(f"Detected multiple project types: {detected_types}. Using first: {detected_types[0]}")

        return detected_types[0]

    def _run_command(self, cmd: List[str], capture: bool = True) -> Tuple[int, str, str]:
        """Run a shell command and return exit code, stdout, stderr."""
        try:
            result = subprocess.run(
                cmd,
                cwd=self.project_path,
                capture_output=capture,
                text=True,
                timeout=300,
            )
            return result.returncode, result.stdout, result.stderr
        except subprocess.TimeoutExpired:
            return -1, "", "Command timed out"
        except FileNotFoundError:
            return -1, "", f"Command not found: {cmd[0]}"

    def check_snyk_installed(self) -> bool:
        """Check if Snyk CLI is installed."""
        code, _, _ = self._run_command(["snyk", "--version"])
        return code == 0

    def check_snyk_authenticated(self) -> bool:
        """Check if Snyk is authenticated."""
        code, _, _ = self._run_command(["snyk", "auth", "--check"])
        return code == 0

    def scan(self) -> List[Dict]:
        """Scan for vulnerabilities using Snyk."""
        print(f"\nScanning {self.project_type} project at {self.project_path}...")

        cmd = ["snyk", "test", "--json"]

        # Add project-specific flags
        if self.project_type == "java":
            if (self.project_path / "pom.xml").exists():
                cmd.extend(["--file=pom.xml"])
            elif (self.project_path / "build.gradle").exists():
                cmd.extend(["--file=build.gradle"])
        elif self.project_type == "node":
            cmd.extend(["--file=package.json"])
        elif self.project_type == "python":
            if (self.project_path / "requirements.txt").exists():
                cmd.extend(["--file=requirements.txt"])
            elif (self.project_path / "Pipfile").exists():
                cmd.extend(["--file=Pipfile"])

        code, stdout, stderr = self._run_command(cmd)

        if code == 0:
            print("No vulnerabilities found!")
            self.vulnerabilities = []
            return []

        try:
            result = json.loads(stdout)
            if isinstance(result, dict) and "vulnerabilities" in result:
                self.vulnerabilities = result["vulnerabilities"]
            elif isinstance(result, list):
                self.vulnerabilities = []
                for r in result:
                    if isinstance(r, dict) and "vulnerabilities" in r:
                        self.vulnerabilities.extend(r["vulnerabilities"])
        except json.JSONDecodeError:
            print(f"Warning: Could not parse Snyk output. stderr: {stderr}")
            self.vulnerabilities = []

        print(f"Found {len(self.vulnerabilities)} vulnerabilities")
        return self.vulnerabilities

    def fix_java(self) -> int:
        """Fix Java vulnerabilities using dependency updates."""
        fixed = 0

        if (self.project_path / "pom.xml").exists():
            print("Attempting to fix Maven dependencies...")
            # Use versions-maven-plugin to update dependencies
            cmd = [
                "mvn",
                "versions:use-latest-releases",
                "-DallowMajorUpdates=false",
                "-DallowSnapshots=false",
            ]
            code, stdout, stderr = self._run_command(cmd)
            if code == 0:
                print("Maven dependencies updated successfully")
                fixed += 1

        elif (self.project_path / "build.gradle").exists():
            print("Attempting to fix Gradle dependencies...")
            # For Gradle, we need to update build.gradle manually or use a plugin
            print("Note: Gradle auto-fix requires manual intervention or use-upgrade plugin")

        return fixed

    def fix_node(self) -> int:
        """Fix Node.js vulnerabilities using npm/yarn audit fix."""
        fixed = 0

        # Determine package manager
        if (self.project_path / "yarn.lock").exists():
            print("Using Yarn to fix vulnerabilities...")
            cmd = ["yarn", "upgrade"]
            code, _, _ = self._run_command(cmd)
            if code == 0:
                fixed += 1
        elif (self.project_path / "pnpm-lock.yaml").exists():
            print("Using pnpm to fix vulnerabilities...")
            cmd = ["pnpm", "update"]
            code, _, _ = self._run_command(cmd)
            if code == 0:
                fixed += 1
        else:
            print("Using npm audit fix...")
            # Try regular fix first
            cmd = ["npm", "audit", "fix"]
            code, stdout, stderr = self._run_command(cmd)
            if code == 0:
                fixed += 1

            # If there are still issues, try with --force (for major updates)
            cmd = ["npm", "audit", "fix", "--force"]
            code, _, _ = self._run_command(cmd)

        # Also try Snyk's wizard for interactive fixes
        print("Running Snyk wizard for additional fixes...")
        cmd = ["snyk", "wizard", "--non-interactive"]
        self._run_command(cmd)

        return fixed

    def fix_python(self) -> int:
        """Fix Python vulnerabilities using pip-audit or safety."""
        fixed = 0

        if (self.project_path / "requirements.txt").exists():
            print("Attempting to fix Python dependencies...")

            # Try using pip-audit for auto-fix
            cmd = ["pip-audit", "--fix", "-r", "requirements.txt"]
            code, stdout, stderr = self._run_command(cmd)

            if code != 0:
                # Fall back to manual upgrade approach
                print("pip-audit not available, trying manual upgrade...")
                self._upgrade_python_packages()
                fixed += 1
            else:
                fixed += 1

        elif (self.project_path / "Pipfile").exists():
            print("Updating Pipfile dependencies...")
            cmd = ["pipenv", "update"]
            code, _, _ = self._run_command(cmd)
            if code == 0:
                fixed += 1

        elif (self.project_path / "pyproject.toml").exists():
            print("Updating Poetry dependencies...")
            cmd = ["poetry", "update"]
            code, _, _ = self._run_command(cmd)
            if code == 0:
                fixed += 1

        return fixed

    def _upgrade_python_packages(self):
        """Upgrade Python packages based on vulnerability data."""
        req_file = self.project_path / "requirements.txt"
        if not req_file.exists():
            return

        # Read current requirements
        with open(req_file, "r") as f:
            lines = f.readlines()

        # Get vulnerable packages from Snyk data
        vulnerable_packages = set()
        for vuln in self.vulnerabilities:
            pkg_name = vuln.get("packageName", vuln.get("name", ""))
            if pkg_name:
                vulnerable_packages.add(pkg_name.lower())

        # Upgrade vulnerable packages
        for pkg in vulnerable_packages:
            print(f"Upgrading {pkg}...")
            cmd = ["pip", "install", "--upgrade", pkg]
            self._run_command(cmd)

        # Regenerate requirements.txt
        cmd = ["pip", "freeze"]
        code, stdout, _ = self._run_command(cmd)
        if code == 0 and stdout:
            with open(req_file, "w") as f:
                f.write(stdout)

    def fix(self) -> int:
        """Fix vulnerabilities based on project type."""
        if not self.vulnerabilities:
            print("No vulnerabilities to fix. Run scan first.")
            return 0

        print(f"\nAttempting to fix {len(self.vulnerabilities)} vulnerabilities...")

        if self.project_type == "java":
            self.fixed_count = self.fix_java()
        elif self.project_type == "node":
            self.fixed_count = self.fix_node()
        elif self.project_type == "python":
            self.fixed_count = self.fix_python()

        # Re-scan to verify fixes
        print("\nRe-scanning to verify fixes...")
        remaining = self.scan()
        self.skipped_count = len(remaining)

        print(f"\nFix summary:")
        print(f"  - Fixed: {len(self.vulnerabilities) - len(remaining)} vulnerabilities")
        print(f"  - Remaining: {len(remaining)} vulnerabilities")

        return self.fixed_count

    def generate_report(self, output_file: Optional[str] = None) -> str:
        """Generate a detailed vulnerability report."""
        report = {
            "generated_at": datetime.now().isoformat(),
            "project_path": str(self.project_path),
            "project_type": self.project_type,
            "summary": {
                "total_vulnerabilities": len(self.vulnerabilities),
                "critical": 0,
                "high": 0,
                "medium": 0,
                "low": 0,
            },
            "vulnerabilities": [],
        }

        # Categorize by severity
        for vuln in self.vulnerabilities:
            severity = vuln.get("severity", "unknown").lower()
            if severity == "critical":
                report["summary"]["critical"] += 1
            elif severity == "high":
                report["summary"]["high"] += 1
            elif severity == "medium":
                report["summary"]["medium"] += 1
            elif severity == "low":
                report["summary"]["low"] += 1

            report["vulnerabilities"].append({
                "id": vuln.get("id", "unknown"),
                "title": vuln.get("title", "Unknown vulnerability"),
                "severity": severity,
                "package": vuln.get("packageName", vuln.get("name", "unknown")),
                "version": vuln.get("version", "unknown"),
                "fix_version": vuln.get("fixedIn", ["N/A"])[0] if vuln.get("fixedIn") else "N/A",
                "description": vuln.get("description", "")[:200],
                "url": vuln.get("url", ""),
            })

        # Sort by severity
        severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3, "unknown": 4}
        report["vulnerabilities"].sort(key=lambda x: severity_order.get(x["severity"], 4))

        # Output
        report_json = json.dumps(report, indent=2)

        if output_file:
            with open(output_file, "w") as f:
                f.write(report_json)
            print(f"Report saved to {output_file}")

        return report_json

    def print_summary(self):
        """Print a human-readable summary of vulnerabilities."""
        if not self.vulnerabilities:
            print("\nNo vulnerabilities found!")
            return

        print(f"\n{'='*60}")
        print(f"VULNERABILITY SUMMARY - {self.project_type.upper()} PROJECT")
        print(f"{'='*60}")

        # Count by severity
        severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        for vuln in self.vulnerabilities:
            sev = vuln.get("severity", "unknown").lower()
            if sev in severity_counts:
                severity_counts[sev] += 1

        print(f"\nTotal: {len(self.vulnerabilities)} vulnerabilities")
        print(f"  Critical: {severity_counts['critical']}")
        print(f"  High:     {severity_counts['high']}")
        print(f"  Medium:   {severity_counts['medium']}")
        print(f"  Low:      {severity_counts['low']}")

        # Show top 10 vulnerabilities
        print(f"\n{'='*60}")
        print("TOP VULNERABILITIES")
        print(f"{'='*60}")

        for i, vuln in enumerate(self.vulnerabilities[:10], 1):
            pkg = vuln.get("packageName", vuln.get("name", "unknown"))
            severity = vuln.get("severity", "unknown").upper()
            title = vuln.get("title", "Unknown")[:50]
            print(f"\n{i}. [{severity}] {pkg}")
            print(f"   {title}")


def main():
    parser = argparse.ArgumentParser(
        description="Snyk Vulnerability Resolver - Fix security vulnerabilities across Java, Node.js, and Python projects"
    )
    parser.add_argument(
        "--path",
        default=".",
        help="Path to the project (default: current directory)",
    )
    parser.add_argument(
        "--project-type",
        choices=["java", "node", "python"],
        help="Force project type (auto-detected if not specified)",
    )
    parser.add_argument(
        "--scan-only",
        action="store_true",
        help="Only scan for vulnerabilities, don't fix",
    )
    parser.add_argument(
        "--fix",
        action="store_true",
        help="Automatically fix vulnerabilities where possible",
    )
    parser.add_argument(
        "--report",
        nargs="?",
        const="snyk-report.json",
        help="Generate a JSON report (optionally specify filename)",
    )

    args = parser.parse_args()

    # Initialize resolver
    resolver = SnykResolver(project_path=args.path, project_type=args.project_type)

    print(f"Snyk Resolver - {resolver.project_type.upper()} Project")
    print(f"Project Path: {resolver.project_path}")

    # Check Snyk installation
    if not resolver.check_snyk_installed():
        print("\nError: Snyk CLI is not installed.")
        print("Install it with: npm install -g snyk")
        sys.exit(1)

    # Check authentication
    if not resolver.check_snyk_authenticated():
        print("\nWarning: Snyk is not authenticated.")
        print("Authenticate with: snyk auth")

    # Scan
    resolver.scan()
    resolver.print_summary()

    # Fix if requested
    if args.fix and not args.scan_only:
        resolver.fix()

    # Generate report if requested
    if args.report:
        resolver.generate_report(args.report)

    # Exit with appropriate code
    if resolver.vulnerabilities:
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()

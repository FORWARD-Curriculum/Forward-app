#!/bin/bash

# Exit on error
set -e

# Print commands
set -x

# Create and activate cirtual environment
python3 -m venv .venv
# ./.venv/Scripts/activate # For windows only
source .venv/bin/activate # Uncomment for Mac/Linux

# Install dependencies
pip install django djangorestframework

# Run migrations
python3 manage.py migrate

# Seed database with test data
python3 manage.py seed_test_data --reset

echo "Development environment is ready"
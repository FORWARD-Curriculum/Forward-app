#!/bin/bash

# Exit on error
set -e

# Print commands
set -x

# Create and activate cirtual environment
python -m venv .venv
source .venv/bin/activate # Uncomment for Mac/Linux

# Install dependencies
pip install django djangorestframework django-cors-headers

# Run migrations
python manage.py migrate

# Seed database with test data
python manage.py seed_test_data --reset

echo "Development environment is ready"
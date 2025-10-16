#!/bin/bash

# Exit on error
set -e

# Print commands
set -x

echo "Setting up Django development environment..."

# Run migrations
python manage.py makemigrations

# Run migrations
python manage.py migrate

python manage.py collectstatic --noinput

# Seed database with test data

python manage.py seed_defaults --reset defaults.json
python manage.py seed_lessons_data --reset lesson1/lesson1.json
python manage.py seed_lessons_data --reset lesson2/lesson2.json




echo "Development environment is ready"
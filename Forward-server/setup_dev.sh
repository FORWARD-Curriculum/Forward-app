#!/bin/bash

# Exit on error
set -e

# Print command
set -x

echo "Setting up Django development environment..."

rm -rf core/migrations/*
touch core/migrations/__init__.py

# Run migrations
python manage.py makemigrations

# Run migrations
python manage.py migrate

python manage.py collectstatic --noinput

# Seed database with test data

python manage.py seed_defaults --reset defaults.json
python manage.py seed_lessons_data --reset going_to_college/lesson.json
python manage.py seed_lessons_data --reset personal_finance_management/lesson.json
python manage.py seed_lessons_data --reset self_advocacy/lesson.json
python manage.py seed_lessons_data --reset disclosure_and_appropriate_communication/lesson.json
# python manage.py seed_lessons_data --reset soft_skills/lesson.json

# python manage.py seed_lessons_data --reset z_example/example.json
# python manage.py seed_lessons_data --reset lesson2/lesson2.json



echo "Development environment is ready"
#!/bin/bash
# Install required Python packages for the data analysis pipeline
set -e

PIP=/Library/Frameworks/Python.framework/Versions/3.12/bin/pip3

echo "Installing data analysis dependencies..."
$PIP install pandas matplotlib seaborn scipy plotly tabulate openpyxl chardet --quiet
echo "Installing document ingestion dependencies..."
$PIP install pypdf pdfplumber python-docx python-pptx --quiet
echo "Dependencies ready."

# Report build

This folder contains `main.tex`.

A GitHub Actions workflow (`.github/workflows/latex.yml`) automatically builds `main.pdf` whenever files under `report/` are pushed, and uploads the generated PDF as an artifact named `report-pdf` on the workflow run page (Actions -> Build LaTeX PDF -> Artifacts).

If you'd like the PDF placed directly in the repo instead of an artifact, I can update the workflow to commit it back to a branch or create a release with the PDF.

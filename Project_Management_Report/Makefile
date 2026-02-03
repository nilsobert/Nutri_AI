# Makefile for Project Management Report

MAIN = project_management_report
LATEX = pdflatex
BIBER = biber
FLAGS = -shell-escape -interaction=nonstopmode

TYPST = typst
VENV_DIR = ../.venv
PYTHON = $(VENV_DIR)/bin/python
PIP = $(PYTHON) -m pip
PYTHON_FALLBACK = python3
PLOT_DIR = typst_plots
PLOT_OUT = typst_plots_out
DATA_DIR = $(PLOT_DIR)/typst_data
REQS = $(DATA_DIR)/requirements.txt
DATA_STAMP = $(DATA_DIR)/analysis.stamp
DATA_CSVS = \
	$(DATA_DIR)/boxplot_pe.csv \
	$(DATA_DIR)/overall_mae_bar.csv
PLOT_PDFS = \
	$(PLOT_OUT)/overall_mae_bar.pdf \
	$(PLOT_OUT)/percentage_error_boxplots.pdf \
	$(PLOT_OUT)/org_chart.pdf \
	$(PLOT_OUT)/gantt_chart.pdf

all: $(MAIN).pdf

$(MAIN).pdf: $(MAIN).tex MyBibliography.bib $(PLOT_PDFS)
	$(LATEX) $(FLAGS) $(MAIN).tex
	-$(BIBER) $(MAIN)
	$(LATEX) $(FLAGS) $(MAIN).tex
	$(LATEX) $(FLAGS) $(MAIN).tex

$(VENV_DIR)/bin/activate:
	( command -v $(PYTHON_FALLBACK) >/dev/null 2>&1 && $(PYTHON_FALLBACK) -m venv $(VENV_DIR) ) || ( command -v python >/dev/null 2>&1 && python -m venv $(VENV_DIR) )
	$(PIP) install --upgrade pip setuptools wheel
	$(PIP) install -r $(REQS)

venv: $(VENV_DIR)/bin/activate $(REQS)


$(DATA_STAMP): $(DATA_DIR)/analysis.py $(DATA_DIR)/Meal_Data_Analysis.csv $(REQS) venv
	$(PYTHON) $(DATA_DIR)/analysis.py
	@touch $(DATA_STAMP)

$(DATA_CSVS): $(DATA_STAMP)

$(PLOT_OUT)/overall_mae_bar.pdf: $(DATA_CSVS)
$(PLOT_OUT)/percentage_error_boxplots.pdf: $(DATA_CSVS)

$(PLOT_OUT)/%.pdf: $(PLOT_DIR)/%.typ
	mkdir -p $(PLOT_OUT)
	$(TYPST) compile $< $@


clean:
	rm -f *.aux *.bbl *.bcf *.blg *.fdb_latexmk *.fls *.log *.out *.run.xml *.synctex.gz *.toc
	rm -rf svg-inkscape/
	rm -rf $(PLOT_OUT)/
	rm -f $(DATA_CSVS) $(DATA_STAMP)
	rm -f $(DATA_DIR)/mean_percentage_error_table.png $(DATA_DIR)/percentage_error_boxplots.png $(DATA_DIR)/overall_accuracy_bar.png

.PHONY: all clean force

force:
	rm -f $(MAIN).pdf
	$(MAKE) clean
	$(MAKE) all

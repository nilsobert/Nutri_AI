# Makefile for Project Management Report

MAIN = project_management_report
LATEX = pdflatex
BIBER = biber
FLAGS = -shell-escape -interaction=nonstopmode

TYPST = typst
PYTHON = ../.venv/bin/python
PLOT_DIR = typst_plots
PLOT_OUT = typst_plots_out
DATA_DIR = $(PLOT_DIR)/typst_data
DATA_CSVS = \
	$(DATA_DIR)/boxplot_pe.csv \
	$(DATA_DIR)/overall_mae_bar.csv
PLOT_PDFS = \
	$(PLOT_OUT)/overall_mae_bar.pdf \
	$(PLOT_OUT)/percentage_error_boxplots.pdf \
	$(PLOT_OUT)/org_chart.pdf

all: $(MAIN).pdf

$(MAIN).pdf: $(MAIN).tex MyBibliography.bib $(PLOT_PDFS)
	$(LATEX) $(FLAGS) $(MAIN).tex
	-$(BIBER) $(MAIN)
	$(LATEX) $(FLAGS) $(MAIN).tex
	$(LATEX) $(FLAGS) $(MAIN).tex

$(DATA_CSVS): $(DATA_DIR)/analysis.py $(DATA_DIR)/Meal_Data_Analysis.csv
	$(PYTHON) $(DATA_DIR)/analysis.py

$(PLOT_OUT)/overall_mae_bar.pdf: $(DATA_CSVS)
$(PLOT_OUT)/percentage_error_boxplots.pdf: $(DATA_CSVS)

$(PLOT_OUT)/%.pdf: $(PLOT_DIR)/%.typ
	mkdir -p $(PLOT_OUT)
	$(TYPST) compile $< $@


clean:
	rm -f *.aux *.bbl *.bcf *.blg *.fdb_latexmk *.fls *.log *.out *.run.xml *.synctex.gz *.toc
	rm -rf svg-inkscape/
	rm -rf $(PLOT_OUT)/
	rm -f $(DATA_CSVS)
	rm -f $(DATA_DIR)/mean_percentage_error_table.png $(DATA_DIR)/percentage_error_boxplots.png $(DATA_DIR)/overall_accuracy_bar.png

.PHONY: all clean force

force:
	rm -f $(MAIN).pdf
	$(MAKE) clean
	$(MAKE) all

# Makefile for Project Management Report

MAIN = project_management_report
LATEX = pdflatex
BIBER = biber
FLAGS = -shell-escape -interaction=nonstopmode

all: $(MAIN).pdf

$(MAIN).pdf: $(MAIN).tex MyBibliography.bib
	$(LATEX) $(FLAGS) $(MAIN).tex
	-$(BIBER) $(MAIN)
	$(LATEX) $(FLAGS) $(MAIN).tex
	$(LATEX) $(FLAGS) $(MAIN).tex

clean:
	rm -f *.aux *.bbl *.bcf *.blg *.fdb_latexmk *.fls *.log *.out *.run.xml *.synctex.gz *.toc
	rm -rf svg-inkscape/

.PHONY: all clean force

force:
	rm -f $(MAIN).pdf
	$(MAKE) clean
	$(MAKE) all

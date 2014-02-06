#######################################################
# Wake Up Platform                                    #
# (c) Telefonica Digital, 2013 - All rights reserved  #
# License: GNU Affero V3 (see LICENSE file)           #
# Fernando Rodríguez Sela <frsela@tid.es>             #
#######################################################

GIT  ?= git
NODE ?= node
NPM ?= npm
GJSLINT ?= gjslint
FIXJSSTYLE ?= fixjsstyle

.PHONY = about dev all version.info
.PHONY = clean clean_global
.PHONY = build build_global
.PHONY = install tests

all: dev install

about:
	@echo "Telefonica R&D WakeUp platform, (c) 2014"
	@echo " use make dev to build development environment"
	@echo " use make all to build development environment and final builds"

dev: clean check_style build tests

version.info:
	@echo "Getting version information from GIT ..."
	@$(GIT) describe --all --always > src/version.info
	@echo " - Version = " `cat src/version.info`

clean: clean_config clean_global clean_src clean_tests
	@echo "Cleaning ..."
	@rm -rf output

clean_config:
	@echo "Cleaning generated config files ..."
	@rm -f src/networks.json

clean_src:
	@echo "Cleaning common src resources ..."
	@rm -rf src/node_modules

clean_global:
	@echo "Cleaning global server instance ..."
	@rm -f src/version.info
	@rm -rf src/shared_libs
	@rm -f src/routers/shared*
	@find . -name "*log" -exec rm -f {} \;

clean_tests:
	@echo "Cleaning tests auxiliar files ..."
	@rm -rf tests/node_modules

build: version.info build_config build_src build_global
	@echo "Building ..."

build_config:
	@echo "Generating networks file ..."
	@echo "{" > src/networks.json
	@echo '  "214-07": { "host": "http://localhost:9000", "range": "10.0.0.0/8", "network": "214-07", "offline": true }' >> src/networks.json
	@echo "}" >> src/networks.json
	@echo "Done!"

build_src:
	@echo "Updating dependencies (please, wait ...)"
	@cd src; $(NPM) install > /dev/null 2> /dev/null

build_global: version.info build_src
	@echo "Building global server instance ..."
	@cp -rfl common/libs src/shared_libs
	@cd common/routers/; for r in `ls *js`; do ln -f $$r ../../src/routers/shared_$$r; done;

install: build
	@echo "Putting global server into output directory ..."
	@mkdir -p output
	@cp -rfl src/* output/
	@find output -name README.md -exec rm {} \;
	@echo "node start.js $1" > output/run_global.sh
	@chmod +x output/run_global.sh

check_style:
	@echo "Checking code style rules ..."
	@$(GJSLINT) --disable 210,217,220,225 -r src -e node_modules
	@$(GJSLINT) --disable 210,217,220,225 -r tests -e node_modules

fix_style:
	@echo "Fixing code style rules ..."
	@$(FIXJSSTYLE) --disable 210,217,220,225 -r src -e node_modules
	@$(FIXJSSTYLE) --disable 210,217,220,225 -r tests -e node_modules

tests: build tests_environment tests_global
	@echo "Executing tests ..."

tests_environment:
	@echo "Preparing tests environment (please wait ...)"
	@cd tests; $(NPM) install > /dev/null 2> /dev/null

tests_global: build tests_environment
	@echo "Executing libs unit tests ..."
	@cd tests; $(NPM) run-script test_libs
	@echo "Launching global server ..."
	@cd src; node start.js > /dev/null & echo "$$!" > ../global.pid
	@echo "Executing unit tests ..."
	@cd tests; $(NPM) run-script test
	@echo "Killing global server ..."
	@kill -9 `cat global.pid`; rm global.pid

cyclomatic_complexity: tests
	@echo "Calculating cyclomatic complexity"
	@tests/node_modules/.bin/cr src/
